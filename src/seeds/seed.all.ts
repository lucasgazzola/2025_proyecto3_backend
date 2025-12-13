import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { ConfigModule } from '@nestjs/config';
import { AreaSchema, Area } from '../mongoose/schemas/area.schema';
import { SubAreaSchema, SubArea } from '../mongoose/schemas/subarea.schema';
import { UserSchema, User, RoleEnum } from '../mongoose/schemas/user.schema';
import { ProjectSchema, Project, ProjectTypeEnum } from '../mongoose/schemas/project.schema';
import { FileSchema, File, FileTypeEnum } from '../mongoose/schemas/file.schema';
import { ClaimSchema, Claim, ClaimCriticalityEnum, ClaimPriorityEnum, ClaimTypeEnum } from '../mongoose/schemas/claim.schema';
import { ClaimStateHistorySchema, ClaimStateHistory, ClaimStatusEnum } from '../mongoose/schemas/claim-state-history.schema';

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function sample<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

async function run() {
  ConfigModule.forRoot({ isGlobal: true });
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost/proyecto3';
  await mongoose.connect(mongoUri);

  const AreaModel = mongoose.model(Area.name, AreaSchema);
  const SubAreaModel = mongoose.model(SubArea.name, SubAreaSchema);
  const UserModel = mongoose.model(User.name, UserSchema);
  const ProjectModel = mongoose.model(Project.name, ProjectSchema);
  const FileModel = mongoose.model(File.name, FileSchema);
  const ClaimModel = mongoose.model(Claim.name, ClaimSchema);
  const ClaimStateHistoryModel = mongoose.model(ClaimStateHistory.name, ClaimStateHistorySchema);

  // Clean (incluye áreas y subáreas)
  await Promise.all([
    ClaimStateHistoryModel.deleteMany({}),
    ClaimModel.deleteMany({}),
    FileModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    UserModel.deleteMany({}),
    SubAreaModel.deleteMany({}),
    AreaModel.deleteMany({}),
  ]);

  // Seed de Áreas y Subáreas (variado y amplio)
  const areasSeed: { name: string; subs: string[] }[] = [
    { name: 'Soporte Técnico', subs: ['Atención al Cliente', 'Mantenimiento de Sistemas', 'Infraestructura', 'Mesa de Ayuda', 'Gestión de Incidentes'] },
    { name: 'Ventas', subs: ['Ventas Minoristas', 'Ventas Mayoristas', 'E-commerce', 'Presupuestos', 'Postventa'] },
    { name: 'Facturación', subs: ['Facturación Electrónica', 'Control de Cobros', 'Gestión de Impuestos', 'Conciliaciones', 'Cuentas a Cobrar'] },
    { name: 'Recursos Humanos', subs: ['Selección de Personal', 'Capacitación y Desarrollo', 'Bienestar y Relaciones Laborales', 'Liquidación de Sueldos', 'Administración de Beneficios'] },
    { name: 'Operaciones', subs: ['Logística', 'Compras', 'Planificación', 'Distribución', 'Control de Calidad'] },
    { name: 'Tecnología', subs: ['Backend', 'Frontend', 'DevOps', 'QA', 'Data Engineering'] },
    { name: 'Marketing', subs: ['Contenido', 'SEO/SEM', 'Branding', 'Redes Sociales', 'Eventos'] },
    { name: 'Finanzas', subs: ['Contabilidad', 'Tesorería', 'Control de Gestión', 'Auditoría', 'Inversiones'] },
    { name: 'Atención al Cliente', subs: ['Soporte de Primer Nivel', 'Gestión de Reclamos', 'Satisfacción del Cliente', 'Retención', 'Encuestas'] },
    { name: 'Legal', subs: ['Contratos', 'Compliance', 'Asuntos Regulatorios', 'Propiedad Intelectual', 'Litigios'] },
    { name: 'Producción', subs: ['Planificación de Producción', 'Mantenimiento', 'Ingeniería de Procesos', 'Seguridad e Higiene', 'Abastecimiento'] },
    { name: 'Producto', subs: ['Product Management', 'UX Research', 'Diseño UX/UI', 'Experimentación', 'Roadmap'] },
    { name: 'Data & Analytics', subs: ['BI', 'Analítica Avanzada', 'Ciencia de Datos', 'Gobernanza de Datos', 'Reporting'] },
    { name: 'Infraestructura', subs: ['Redes', 'Servidores', 'Cloud', 'Seguridad', 'Monitoreo'] },
    { name: 'Calidad', subs: ['Aseguramiento de Calidad', 'Control de Calidad', 'Normativas ISO', 'Mejora Continua', 'Auditorías Internas'] },
  ];

  const createdAreas: Types.ObjectId[] = [];
  for (const a of areasSeed) {
    const area = await AreaModel.create({ name: a.name, description: `${a.name} - área funcional` });
    const subsIds: Types.ObjectId[] = [];
    for (const s of a.subs) {
      const sub = await SubAreaModel.create({ name: s, area: area._id });
      subsIds.push(sub._id);
    }
    await AreaModel.findByIdAndUpdate(area._id, { $set: { subAreas: subsIds } });
    createdAreas.push(area._id);
  }

  // Áreas adicionales para volumen
  const extraAreasCount = 20;
  for (let i = 1; i <= extraAreasCount; i++) {
    const areaName = `Área ${i.toString().padStart(2, '0')}`;
    const area = await AreaModel.create({ name: areaName });
    const subs = Array.from({ length: 5 }, (_, idx) => `Subárea ${i}-${idx + 1}`);
    const subsIds: Types.ObjectId[] = [];
    for (const s of subs) {
      const sub = await SubAreaModel.create({ name: s, area: area._id });
      subsIds.push(sub._id);
    }
    await AreaModel.findByIdAndUpdate(area._id, { $set: { subAreas: subsIds } });
    createdAreas.push(area._id);
  }

  const areas = await AreaModel.find().lean();
  const subareas = await SubAreaModel.find().lean();

  // Users
  const firstNames = ['Lucas', 'Ana', 'Maria', 'Juan', 'Sofia', 'Diego', 'Carla', 'Pedro', 'Florencia', 'Martin'];
  const lastNames = ['Garcia', 'Fernandez', 'Gomez', 'Rodriguez', 'Lopez', 'Martinez', 'Perez', 'Sanchez', 'Romero', 'Alonso'];
  const roles = [RoleEnum.USER, RoleEnum.CUSTOMER, RoleEnum.AUDITOR, RoleEnum.ADMIN];
  const usersCreated: Types.ObjectId[] = [];
  for (let i = 0; i < 80; i++) {
    const fn = rand(firstNames); const ln = rand(lastNames);
    const email = `${fn}.${ln}.${i}@example.com`.toLowerCase();
    const role = rand(roles);
    const sub = rand(subareas);
    const plain = 'Password123!';
    const hashed = await bcrypt.hash(plain, 10);
    const user = await UserModel.create({
      firstName: fn,
      lastName: ln,
      email,
      password: hashed,
      phone: `+54 9 11 ${Math.floor(10000000 + Math.random()*89999999)}`,
      role,
      subArea: sub?._id ?? null,
    });
    usersCreated.push(user._id);
  }

  // Projects
  const projectTypes = Object.values(ProjectTypeEnum);
  const projectsCreated: Types.ObjectId[] = [];
  for (let i = 0; i < 60; i++) {
    const owner = rand(usersCreated);
    const proj = await ProjectModel.create({
      title: `Proyecto ${i + 1}`,
      description: `Descripción del proyecto ${i + 1}`,
      user: owner,
      projectType: rand(projectTypes),
    });
    projectsCreated.push(proj._id);
  }

  // Files
  const fileTypes = Object.values(FileTypeEnum);
  const filesCreated: Types.ObjectId[] = [];
  for (let i = 0; i < 40; i++) {
    const file = await FileModel.create({
      name: `archivo_${i + 1}.${rand(fileTypes).toLowerCase()}`,
      fileType: rand(fileTypes),
    });
    filesCreated.push(file._id);
  }

  // Claims
  const priorities = Object.values(ClaimPriorityEnum);
  const severities = Object.values(ClaimCriticalityEnum);
  const claimTypes = Object.values(ClaimTypeEnum);
  const claimsCreated: Types.ObjectId[] = [];
  for (let i = 0; i < 120; i++) {
    const project = rand(projectsCreated);
    const user = rand(usersCreated);
    const area = rand(areas);
    const file = Math.random() < 0.4 ? rand(filesCreated) : undefined;
    const claim = await ClaimModel.create({
      code: `CLM-${(1000 + i).toString()}`,
      description: `Incidente ${(i + 1)} en ${area.name}`,
      project,
      user,
      priority: rand(priorities),
      severity: rand(severities),
      claimType: rand(claimTypes),
      area: area._id,
      file,
    });
    claimsCreated.push(claim._id);
  }

  // Claim state histories
  const statuses = Object.values(ClaimStatusEnum);
  for (const claimId of claimsCreated) {
    const events = Math.floor(2 + Math.random()*4); // 2-5 eventos
    let start = new Date(Date.now() - Math.floor(Math.random()*20)*24*60*60*1000);
    for (let e = 0; e < events; e++) {
      const user = rand(usersCreated);
      const startTime = new Date(start);
      const endTime = new Date(startTime.getTime() + Math.floor(Math.random()*48)*60*60*1000);
      const state = statuses[Math.min(e, statuses.length - 1)];
      await ClaimStateHistoryModel.create({
        action: `Evento ${e + 1}`,
        startTime,
        endTime: e === events - 1 ? undefined : endTime,
        startDate: startTime,
        endDate: e === events - 1 ? undefined : endTime,
        claim: claimId,
        claimState: state,
        user,
      });
      start = endTime;
    }
  }

  console.log('Seed completo: Users, Projects, Files, Claims, Histories poblados.');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
