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
    const claimMatch: any = {};
    Object.assign(claimMatch, this.buildDateMatch(filters, 'createdAt'));

    if (filters.projectIds && filters.projectIds.length) {
      claimMatch['project'] = { $in: filters.projectIds.map((id) => new Types.ObjectId(id)) };
    }
    if (filters.projectId) {
      claimMatch['project'] = new Types.ObjectId(filters.projectId);
    }
    if (filters.claimType) {
      claimMatch['claimType'] = filters.claimType;
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

    // 1) Claims por mes
    const claimsPerMonth = await this.claimModel
      .aggregate([
        { $match: claimMatch },
        ...claimLookupProject,
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: '$_id', count: 1 } },
        { $sort: { month: 1 } },
      ])
      .exec();

    // 2) Estado actual: pendientes/en curso/resueltos
    const historyMatch: any = { endDate: null };
    Object.assign(historyMatch, this.buildDateMatch(filters, 'startDate'));

    // Filtros por área/subárea/responsable
    if (filters.areaId) historyMatch['area._id'] = new Types.ObjectId(filters.areaId);
    if (filters.subareaId) historyMatch['area.subarea._id'] = new Types.ObjectId(filters.subareaId);
    if (filters.responsibleUserId) historyMatch['user'] = new Types.ObjectId(filters.responsibleUserId);

    const currentStatusAgg = await this.historyModel
      .aggregate([
        { $match: historyMatch },
        // join claim -> project + type filters
        {
          $lookup: {
            from: 'claims',
            localField: 'claim',
            foreignField: '_id',
            as: 'claimDoc',
          },
        },
        { $unwind: '$claimDoc' },
        ...claimLookupProject.map((step) => ({
          ...(step.$lookup
            ? step
            : step.$match
            ? step
            : step),
        })),
        ...(filters.claimType ? [{ $match: { 'claimDoc.claimType': filters.claimType } }] : []),
        {
          $group: {
            _id: '$claimStatus',
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
    const resolutionAgg = await this.historyModel
      .aggregate([
        // traer por claim las fechas de inicio (PENDING) y fin (RESOLVED)
        {
          $match: {
            ...(filters.fromDate || filters.toDate ? this.buildDateMatch(filters, 'startDate') : {}),
          },
        },
        {
          $group: {
            _id: '$claim',
            pendingStart: {
              $min: {
                $cond: [{ $eq: ['$claimStatus', 'PENDING'] }, '$startDate', null],
              },
            },
            resolvedEnd: {
              $max: {
                $cond: [{ $eq: ['$claimStatus', 'RESOLVED'] }, '$endDate', null],
              },
            },
          },
        },
        { $match: { pendingStart: { $ne: null }, resolvedEnd: { $ne: null } } },
        {
          $lookup: {
            from: 'claims',
            localField: '_id',
            foreignField: '_id',
            as: 'claimDoc',
          },
        },
        { $unwind: '$claimDoc' },
        ...claimLookupProject,
        ...(filters.claimType ? [{ $match: { 'claimDoc.claimType': filters.claimType } }] : []),
        {
          $project: {
            claimType: '$claimDoc.claimType',
            diffHours: {
              $divide: [{ $subtract: ['$resolvedEnd', '$pendingStart'] }, 1000 * 60 * 60],
            },
          },
        },
        {
          $group: {
            _id: '$claimType',
            avgHours: { $avg: '$diffHours' },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, claimType: '$_id', avgHours: { $round: ['$avgHours', 2] }, count: 1 } },
      ])
      .exec();

    // 4) Carga por área (estado actual)
    const workloadByArea = await this.historyModel
      .aggregate([
        { $match: { ...historyMatch } },
        {
          $group: {
            _id: { id: '$area._id', name: '$area.name' },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, areaId: '$_id.id', areaName: '$_id.name', count: 1 } },
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

    // 6) Tipos de reclamo más comunes
    const commonClaimTypes = await this.claimModel
      .aggregate([
        { $match: claimMatch },
        ...claimLookupProject,
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
