import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { ConfigModule } from '@nestjs/config';
import { AreaSchema, Area } from '../mongoose/schemas/area.schema';
import { SubAreaSchema, SubArea } from '../mongoose/schemas/subarea.schema';
import { UserSchema, User, RoleEnum } from '../mongoose/schemas/user.schema';
import { ProjectSchema, Project, ProjectTypeEnum } from '../mongoose/schemas/project.schema';
// Files: omit seeding to avoid creating file records without URLs
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
  // const FileModel = mongoose.model(File.name, FileSchema);
  const ClaimModel = mongoose.model(Claim.name, ClaimSchema);
  const ClaimStateHistoryModel = mongoose.model(ClaimStateHistory.name, ClaimStateHistorySchema);

  // Clean (incluye áreas y subáreas)
  await Promise.all([
    ClaimStateHistoryModel.deleteMany({}),
    ClaimModel.deleteMany({}),
    // FileModel.deleteMany({}),
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

  // No se crean áreas adicionales; solo se usan las definidas en `areasSeed`.

  const areas = await AreaModel.find().lean();
  const subareas = await SubAreaModel.find().lean();

  // Users base
  const firstNames = ['Lucas', 'Ana', 'Maria', 'Juan', 'Sofia', 'Diego', 'Carla', 'Pedro', 'Florencia', 'Martin', 'Alvaro', 'Camila', 'Jorge', 'Valentina', 'Nicolas', 'Lucia', 'Federico', 'Gabriela', 'Santiago', 'Julieta'];
  const lastNames = ['Garcia', 'Fernandez', 'Gomez', 'Rodriguez', 'Lopez', 'Martinez', 'Perez', 'Sanchez', 'Romero', 'Alonso', 'Torres', 'Ruiz', 'Diaz', 'Vargas', 'Castro', 'Rojas', 'Silva', 'Mendez', 'Cruz', 'Ortiz'];

  const usersCreated: Types.ObjectId[] = [];
  const customers: Types.ObjectId[] = [];
  const usersRoleUser: Types.ObjectId[] = [];

  // Specific users
  const specificUsers = [
    { email: 'administrador1@example.com', password: 'Administrador1pass', role: RoleEnum.ADMIN, firstName: 'Admin', lastName: 'Uno' },
    { email: 'user1@example.com', password: 'User1pass', role: RoleEnum.USER, firstName: 'User', lastName: 'Uno' },
    { email: 'auditor1@example.com', password: 'Auditor1pass', role: RoleEnum.AUDITOR, firstName: 'Auditor', lastName: 'Uno' },
    { email: 'customer1@example.com', password: 'Customer1pass', role: RoleEnum.CUSTOMER, firstName: 'Customer', lastName: 'Uno' },
  ];

  const specificIds: Record<string, Types.ObjectId> = {};
  for (const s of specificUsers) {
    const hashed = await bcrypt.hash(s.password, 10);
    const sub = rand(subareas);
    const u = await UserModel.create({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      password: hashed,
      phone: `+54 9 11 ${Math.floor(10000000 + Math.random()*89999999)}`,
      role: s.role,
      subArea: sub?._id ?? null,
    });
    usersCreated.push(u._id);
    specificIds[s.email] = u._id;
    if (s.role === RoleEnum.CUSTOMER) customers.push(u._id);
    if (s.role === RoleEnum.USER) usersRoleUser.push(u._id);
  }

  // 40 customers base
  for (let i = 0; i < 40; i++) {
    const fn = rand(firstNames); const ln = rand(lastNames);
    const email = `${fn}.${ln}.customer.${i}@example.com`.toLowerCase();
    const sub = rand(subareas);
    const hashed = await bcrypt.hash('Password123!', 10);
    const u = await UserModel.create({
      firstName: fn,
      lastName: ln,
      email,
      password: hashed,
      phone: `+54 9 11 ${Math.floor(10000000 + Math.random()*89999999)}`,
      role: RoleEnum.CUSTOMER,
      subArea: sub?._id ?? null,
    });
    usersCreated.push(u._id);
    customers.push(u._id);
  }

  // Extra role users (for variety and histories)
  const createRoleUsers = async (role: RoleEnum, count: number) => {
    for (let i = 0; i < count; i++) {
      const fn = rand(firstNames); const ln = rand(lastNames);
      const email = `${fn}.${ln}.${role}.${i}@example.com`.toLowerCase();
      const sub = rand(subareas);
      const hashed = await bcrypt.hash('Password123!', 10);
      const u = await UserModel.create({
        firstName: fn,
        lastName: ln,
        email,
        password: hashed,
        phone: `+54 9 11 ${Math.floor(10000000 + Math.random()*89999999)}`,
        role,
        subArea: sub?._id ?? null,
      });
      usersCreated.push(u._id);
      if (role === RoleEnum.USER) usersRoleUser.push(u._id);
    }
  };
  await createRoleUsers(RoleEnum.USER, 15);
  await createRoleUsers(RoleEnum.ADMIN, 5);
  await createRoleUsers(RoleEnum.AUDITOR, 5);

  // Projects: up to 4 per base customer, and 5 for specific customer
  const projectTypes = Object.values(ProjectTypeEnum);
  const projectsCreated: { id: Types.ObjectId; owner: Types.ObjectId }[] = [];

  // 5 projects for specific customer1
  const customer1Id = specificIds['customer1@example.com'];
  if (customer1Id) {
    for (let i = 0; i < 5; i++) {
      const proj = await ProjectModel.create({
        title: `Proyecto Customer1 - ${i + 1}`,
        description: `Proyecto del cliente customer1 (${i + 1})`,
        user: customer1Id,
        projectType: rand(projectTypes),
      });
      projectsCreated.push({ id: proj._id, owner: customer1Id });
    }
  }

  // 1-4 projects per each of the 40 customers
  for (const owner of customers) {
    // skip customer1 (already created 5)
    if (customer1Id && String(owner) === String(customer1Id)) continue;
    const count = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const idx = projectsCreated.length + 1;
      const proj = await ProjectModel.create({
        title: `Proyecto ${idx}`,
        description: `Descripción del proyecto ${idx}`,
        user: owner,
        projectType: rand(projectTypes),
      });
      projectsCreated.push({ id: proj._id, owner });
    }
  }

  // Skip file seeding to ensure no claim has images/files by default

  // Claims
  const priorities = Object.values(ClaimPriorityEnum);
  const criticalities = Object.values(ClaimCriticalityEnum);
  const claimTypes = Object.values(ClaimTypeEnum);
  const claimsCreated: Types.ObjectId[] = [];

  // Helper to get random date between 2020-01-01 and 2025-12-31
  const minDate = new Date('2020-01-01T00:00:00.000Z').getTime();
  const maxDate = new Date('2025-12-31T23:59:59.999Z').getTime();
  const randomDateBetween = (fromMs?: number): Date => {
    const startMs = Math.max(minDate, fromMs ?? minDate);
    const span = Math.max(1, maxDate - startMs);
    const ms = startMs + Math.floor(Math.random() * span);
    return new Date(ms);
  };

  // Create 10 claims for specific customer across their 5 projects
  if (customer1Id) {
    const c1Projects = projectsCreated.filter(p => String(p.owner) === String(customer1Id));
    for (let i = 0; i < 10; i++) {
      const projectObj = rand(c1Projects);
      const project = projectObj.id;
      const chosenPriority = rand(priorities);
      const chosenCriticality = rand(criticalities);
      const chosenClaimType = rand(claimTypes);
      const claim = await ClaimModel.create({
        description: `Incidente c1-${i + 1}`,
        project,
        user: customer1Id,
      });
      claimsCreated.push(claim._id);
      await ProjectModel.findByIdAndUpdate(project, { $push: { claims: claim._id } });
      const firstStart = randomDateBetween();
      await ClaimStateHistoryModel.create({
        action: 'Creado',
        startTime: firstStart,
        startDate: firstStart,
        claim: claim._id,
        claimStatus: ClaimStatusEnum.PENDING,
        priority: chosenPriority,
        criticality: chosenCriticality,
        claimType: chosenClaimType,
        user: customer1Id,
      });
    }
  }

  // Create claims for other projects (random 0-4 per project)
  for (const projectObj of projectsCreated) {
    // skip projects that already have claims for c1 in the loop above (they will still get more possibly)
    const createCount = Math.floor(Math.random() * 5); // 0..4
    for (let i = 0; i < createCount; i++) {
      const project = projectObj.id;
      const owner = projectObj.owner; // customer owner
      const chosenPriority = rand(priorities);
      const chosenCriticality = rand(criticalities);
      const chosenClaimType = rand(claimTypes);
      const claim = await ClaimModel.create({
        description: `Incidente ${i + 1} del proyecto`,
        project,
        user: owner,
      });
      claimsCreated.push(claim._id);
      await ProjectModel.findByIdAndUpdate(project, { $push: { claims: claim._id } });
      const firstStart = randomDateBetween();
      await ClaimStateHistoryModel.create({
        action: 'Creado',
        startTime: firstStart,
        startDate: firstStart,
        claim: claim._id,
        claimStatus: ClaimStatusEnum.PENDING,
        priority: chosenPriority,
        criticality: chosenCriticality,
        claimType: chosenClaimType,
        user: owner,
      });
    }
  }

  // Additional Claim state histories with chaining logic
  const statuses = [
    ClaimStatusEnum.PENDING,
    ClaimStatusEnum.IN_PROGRESS,
    ClaimStatusEnum.RESOLVED,
  ];

  for (const claimId of claimsCreated) {
    const extraEvents = Math.floor(Math.random() * 4); // 0..3 extra
    for (let e = 0; e < extraEvents; e++) {
      const lastHistory = await ClaimStateHistoryModel
        .findOne({ claim: claimId })
        .sort({ startDate: -1 })
        .lean();
      if (!lastHistory) break;

      // If last is RESOLVED, stop and do not update its endDate
      if (lastHistory.claimStatus === ClaimStatusEnum.RESOLVED) break;

      // Start after last startDate
      const lastStartMs = new Date(lastHistory.startDate).getTime();
      const startDate = randomDateBetween(lastStartMs + 60 * 60 * 1000); // at least +1h

      // Close previous linking endDate to new startDate (as requested)
      await ClaimStateHistoryModel.findByIdAndUpdate(lastHistory._id, {
        endDate: startDate,
        endTime: startDate,
      });

      const claimPriority = lastHistory.priority ?? rand(priorities);
      const claimCriticality = lastHistory.criticality ?? rand(criticalities);
      const claimType = lastHistory.claimType ?? rand(claimTypes);

      // Random USER
      const editor = rand(usersRoleUser.length ? usersRoleUser : usersCreated);

      // Choose next status (prefer progress, possibly resolved at the end)
      const nextStatus = e === extraEvents - 1 && Math.random() < 0.6
        ? ClaimStatusEnum.RESOLVED
        : ClaimStatusEnum.IN_PROGRESS;

      // Subsequent histories must include area + subarea
      const areaPick = rand(areas);
      const subsForArea = subareas.filter(s => String(s.area) === String(areaPick._id));
      const subPick = subsForArea.length ? rand(subsForArea) : undefined;

      await ClaimStateHistoryModel.create({
        action: nextStatus === ClaimStatusEnum.RESOLVED ? 'Resuelto' : `Actualización ${e + 1}`,
        startTime: startDate,
        startDate: startDate,
        subarea: subPick?._id,
        claim: claimId,
        claimStatus: nextStatus,
        priority: claimPriority,
        criticality: claimCriticality,
        claimType,
        user: editor,
      });
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