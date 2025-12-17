import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { Claim, ClaimDocument } from '../mongoose/schemas/claim.schema';
import { ClaimStateHistory, ClaimStateHistoryDocument } from '../mongoose/schemas/claim-state-history.schema';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(ClaimStateHistory.name)
    private readonly historyModel: Model<ClaimStateHistoryDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async getReportsForAdmin(filters: DashboardFiltersDto) {
    const base = await this.buildReports(filters);
    return base;
  }

  async getReportsForCustomer(customerId: string, filters: DashboardFiltersDto) {
    const customerProjectIds = await this.projectModel
      .find({ user: new Types.ObjectId(customerId) }, { _id: 1 })
      .lean()
      .exec();
    const projectIds = customerProjectIds.map((p) => p._id.toString());
    const mergedFilters: DashboardFiltersDto = {
      ...filters,
      projectIds: [...(filters.projectIds || []), ...projectIds],
      customerId: customerId,
    };
    const base = await this.buildReports(mergedFilters);
    return base;
  }

  async getReportsForUser(userId: string, filters: DashboardFiltersDto) {
    // Para USER: limitar todos los reportes a claims donde el usuario
    // aparece en al menos un ClaimStateHistory (no solo el actual)
    const mergedFilters: DashboardFiltersDto = {
      ...filters,
      responsibleUserId: userId,
    };
    const base = await this.buildReports(mergedFilters);
    return base;
  }

  private buildDateMatch(filter: DashboardFiltersDto, field: string) {
    const match: any = {};
    if (filter.fromDate || filter.toDate) {
      match[field] = {};
      if (filter.fromDate) match[field]['$gte'] = new Date(filter.fromDate);
      if (filter.toDate) match[field]['$lte'] = new Date(filter.toDate);
    }
    return match;
  }

  private async buildReports(filters: DashboardFiltersDto) {
    // Filtros base sobre Claims
    const claimMatch: any = {};
    Object.assign(claimMatch, this.buildDateMatch(filters, 'createdAt'));

    if (filters.projectIds && filters.projectIds.length) {
      claimMatch['project'] = { $in: filters.projectIds.map((id) => new Types.ObjectId(id)) };
    }
    if (filters.projectId) {
      claimMatch['project'] = new Types.ObjectId(filters.projectId);
    }
    if (filters.search) {
      claimMatch['description'] = { $regex: filters.search, $options: 'i' };
    }

    // Optional join filters requiring project
    const claimLookupProject: any[] = [
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'projectDoc',
        },
      },
      { $unwind: '$projectDoc' },
    ];

    if (filters.projectType) {
      claimLookupProject.push({ $match: { 'projectDoc.projectType': filters.projectType } });
    }
    if (filters.customerId) {
      claimLookupProject.push({ $match: { 'projectDoc.user': new Types.ObjectId(filters.customerId) } });
    }

    // 1) Claims por mes (según PRIMER startDate del historial del claim)
    // Se calcula el primer startDate por claim y se agrupa por mes de esa fecha.
    const claimDocFilters: any = {};
    if (filters.projectIds && filters.projectIds.length) {
      claimDocFilters['claimDoc.project'] = { $in: filters.projectIds.map((id) => new Types.ObjectId(id)) };
    }
    if (filters.projectId) {
      claimDocFilters['claimDoc.project'] = new Types.ObjectId(filters.projectId);
    }
    if (filters.search) {
      claimDocFilters['claimDoc.description'] = { $regex: filters.search, $options: 'i' };
    }

    const firstHistoryPerClaim = await this.historyModel
      .aggregate([
        // No filtramos por fecha aquí para no sesgar el primer startDate
        { $sort: { startDate: 1 } },
        {
          $group: {
            _id: '$claim',
            firstStartDate: { $first: '$startDate' },
            usersSet: { $addToSet: '$user' },
          },
        },
        // Si se pide responsibleUserId, incluir solo claims donde el usuario participó en algún historial
        ...(filters.responsibleUserId
          ? [{ $match: { usersSet: { $in: [new Types.ObjectId(filters.responsibleUserId)] } } }]
          : []),
        {
          $lookup: {
            from: 'claims',
            localField: '_id',
            foreignField: '_id',
            as: 'claimDoc',
          },
        },
        { $unwind: '$claimDoc' },
        // Filtros sobre claim (project/search)
        ...(Object.keys(claimDocFilters).length ? [{ $match: claimDocFilters }] : []),
        // Join con proyectos para filtros por tipo/cliente
        {
          $lookup: {
            from: 'projects',
            localField: 'claimDoc.project',
            foreignField: '_id',
            as: 'projectDoc',
          },
        },
        { $unwind: '$projectDoc' },
        ...(filters.projectType ? [{ $match: { 'projectDoc.projectType': filters.projectType } }] : []),
        ...(filters.customerId ? [{ $match: { 'projectDoc.user': new Types.ObjectId(filters.customerId) } }] : []),
        // Filtro de rango por creación real (primer startDate)
        ...(filters.fromDate || filters.toDate
          ? [{ $match: this.buildDateMatch(filters, 'firstStartDate') }]
          : []),
        { $project: { firstStartDate: 1 } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$firstStartDate' } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: '$_id', count: 1 } },
        { $sort: { month: 1 } },
      ])
      .exec();
    const claimsPerMonth = firstHistoryPerClaim;

    // 2) Estado actual: pendientes/en curso/resueltos
    // Estado actual basado en historial vigente (endDate null)
    const historyMatch: any = { endDate: null };
    Object.assign(historyMatch, this.buildDateMatch(filters, 'startDate'));

    // Filtros por subárea/responsable en historial actual
    if (filters.subareaId) historyMatch['subarea'] = new Types.ObjectId(filters.subareaId);
    if (filters.responsibleUserId) historyMatch['user'] = new Types.ObjectId(filters.responsibleUserId);

    // Estado actual usando el ÚLTIMO historial por reclamo (independiente de endDate)
    const currentStatusAgg = await this.claimModel
      .aggregate([
        { $match: claimMatch },
        ...claimLookupProject,
        // Si responsibleUserId está presente, limitar a claims donde el usuario participó en algún historial
        ...(filters.responsibleUserId
          ? [
              {
                $lookup: {
                  from: 'claimstatehistories',
                  let: { claimId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$claim', '$$claimId'] },
                            { $eq: ['$user', new Types.ObjectId(filters.responsibleUserId)] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'involvement',
                },
              },
              { $match: { involvement: { $not: { $size: 0 } } } },
            ]
          : []),
        // traer historiales del reclamo
        {
          $lookup: {
            from: 'claimstatehistories',
            localField: '_id',
            foreignField: 'claim',
            as: 'histories',
          },
        },
        // ordenar historiales por createdAt desc
        { $unwind: '$histories' },
        { $sort: { 'histories.createdAt': -1 } },
        // tomar el último historial por reclamo
        {
          $group: {
            _id: '$_id',
            latestStatus: { $first: '$histories.claimStatus' },
            latestType: { $first: '$histories.claimType' },
          },
        },
        // filtrar por claimType si corresponde
        ...(filters.claimType ? [{ $match: { latestType: filters.claimType } }] : []),
        // agrupar por estado
        {
          $group: {
            _id: '$latestStatus',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const statusCounts = {
      pending: currentStatusAgg.find((d) => d._id === 'PENDING')?.count || 0,
      inProgress: currentStatusAgg.find((d) => d._id === 'IN_PROGRESS')?.count || 0,
      resolved: currentStatusAgg.find((d) => d._id === 'RESOLVED')?.count || 0,
    };

    // 3) Promedio de resolución por tipo
    // Calcular diff entre PRIMER startDate y ÚLTIMO startDate por claim, solo claims con estado RESOLVED
    const resolutionAgg = await this.historyModel
      .aggregate([
        { $sort: { startDate: 1 } },
        {
          $group: {
            _id: '$claim',
            firstStart: { $first: '$startDate' },
            lastStart: { $last: '$startDate' },
            statuses: { $addToSet: '$claimStatus' },
            lastType: { $last: '$claimType' },
            usersSet: { $addToSet: '$user' },
          },
        },
        { $match: { statuses: { $in: ['RESOLVED'] } } },
        ...(filters.responsibleUserId
          ? [{ $match: { usersSet: { $in: [new Types.ObjectId(filters.responsibleUserId)] } } }]
          : []),
        // Filtro por fechas (consideramos la fecha de "cierre" como el último startDate)
        ...(filters.fromDate || filters.toDate ? [{ $match: this.buildDateMatch(filters, 'lastStart') }] : []),
        {
          $lookup: {
            from: 'claims',
            localField: '_id',
            foreignField: '_id',
            as: 'claimDoc',
          },
        },
        { $unwind: '$claimDoc' },
        // Filtros por proyecto/tipo/cliente
        {
          $lookup: {
            from: 'projects',
            localField: 'claimDoc.project',
            foreignField: '_id',
            as: 'projectDoc',
          },
        },
        { $unwind: '$projectDoc' },
        ...(filters.projectIds && filters.projectIds.length
          ? [{ $match: { 'projectDoc._id': { $in: filters.projectIds.map((id) => new Types.ObjectId(id)) } } }]
          : []),
        ...(filters.projectId ? [{ $match: { 'projectDoc._id': new Types.ObjectId(filters.projectId) } }] : []),
        ...(filters.projectType ? [{ $match: { 'projectDoc.projectType': filters.projectType } }] : []),
        ...(filters.customerId ? [{ $match: { 'projectDoc.user': new Types.ObjectId(filters.customerId) } }] : []),
        ...(filters.search ? [{ $match: { 'claimDoc.description': { $regex: filters.search, $options: 'i' } } }] : []),
        ...(filters.claimType ? [{ $match: { lastType: filters.claimType } }] : []),
        {
          $project: {
            claimType: '$lastType',
            diffDays: { $divide: [{ $subtract: ['$lastStart', '$firstStart'] }, 1000 * 60 * 60 * 24] },
          },
        },
        { $group: { _id: '$claimType', avgDays: { $avg: '$diffDays' }, count: { $sum: 1 } } },
        { $project: { _id: 0, claimType: '$_id', avgDays: { $round: ['$avgDays', 2] }, count: 1 } },
      ])
      .exec();

    // 4) Carga por área (estado actual)
    const workloadByArea = await this.historyModel
      .aggregate([
        { $match: { ...historyMatch } },
        {
          $group: {
            _id: '$subarea',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'subareas',
            localField: '_id',
            foreignField: '_id',
            as: 'subareaDoc',
          },
        },
        { $unwind: '$subareaDoc' },
        {
          $lookup: {
            from: 'areas',
            localField: 'subareaDoc.area',
            foreignField: '_id',
            as: 'areaDoc',
          },
        },
        { $unwind: '$areaDoc' },
        { $project: { _id: 0, areaId: '$areaDoc._id', areaName: '$areaDoc.name', subareaId: '$subareaDoc._id', subareaName: '$subareaDoc.name', count: 1 } },
      ])
      .exec();

    // 5) Carga por responsable (estado actual)
    const workloadByResponsible = await this.historyModel
      .aggregate([
        { $match: { ...historyMatch } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $project: { _id: 0, userId: '$_id', count: 1 } },
      ])
      .exec();

    // 6) Tipos de reclamo más comunes (sobre TODOS los historiales, no solo endDate null)
    const commonClaimTypes = await this.historyModel
      .aggregate([
        // Filtro por fechas en startDate si aplica
        ...(filters.fromDate || filters.toDate ? [{ $match: this.buildDateMatch(filters, 'startDate') }] : []),
        // Filtros por subárea/responsable si se piden
        ...(filters.subareaId ? [{ $match: { subarea: new Types.ObjectId(filters.subareaId) } }] : []),
        ...(filters.responsibleUserId ? [{ $match: { user: new Types.ObjectId(filters.responsibleUserId) } }] : []),
        {
          $lookup: {
            from: 'claims',
            localField: 'claim',
            foreignField: '_id',
            as: 'claimDoc',
          },
        },
        { $unwind: '$claimDoc' },
        // Join con proyectos para filtros por tipo/cliente/proyecto
        {
          $lookup: {
            from: 'projects',
            localField: 'claimDoc.project',
            foreignField: '_id',
            as: 'projectDoc',
          },
        },
        { $unwind: '$projectDoc' },
        ...(filters.projectIds && filters.projectIds.length
          ? [{ $match: { 'projectDoc._id': { $in: filters.projectIds.map((id) => new Types.ObjectId(id)) } } }]
          : []),
        ...(filters.projectId ? [{ $match: { 'projectDoc._id': new Types.ObjectId(filters.projectId) } }] : []),
        ...(filters.projectType ? [{ $match: { 'projectDoc.projectType': filters.projectType } }] : []),
        ...(filters.customerId ? [{ $match: { 'projectDoc.user': new Types.ObjectId(filters.customerId) } }] : []),
        ...(filters.search ? [{ $match: { 'claimDoc.description': { $regex: filters.search, $options: 'i' } } }] : []),
        ...(filters.claimType ? [{ $match: { claimType: filters.claimType } }] : []),
        { $group: { _id: '$claimType', count: { $sum: 1 } } },
        { $project: { _id: 0, claimType: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ])
      .exec();

    return {
      claimsPerMonth,
      statusCounts,
      avgResolutionByType: resolutionAgg,
      workloadByArea,
      workloadByResponsible,
      commonClaimTypes,
    };
  }
}
