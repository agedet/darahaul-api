CREATE TYPE "user_role" AS ENUM ('DRIVER', 'MECHANIC', 'ADMIN_L1', 'ADMIN_L2', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "vehicle_status" AS ENUM ('ACTIVE', 'FAULT_REPORTED', 'AT_REPAIR_SHOP', 'UNDER_DIAGNOSIS', 'AWAITING_APPROVAL', 'REPAIR_IN_PROGRESS', 'FIXED', 'READY_FOR_PICKUP', 'RETIRED');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('ACTIVE', 'ENDED', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "deposit_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "repair_status" AS ENUM ('REPORTED', 'AT_SHOP', 'DIAGNOSED', 'AWAITING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'FIXED', 'PICKED_UP', 'REJECTED');

-- CreateEnum
CREATE TYPE "expense_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone_number" TEXT,
    "password" TEXT,
    "country" TEXT,
    "state" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "terms_accepted" BOOLEAN,
    "otp_count" INTEGER,
    "otp_generated_at" TIMESTAMP(3),
    "email_confirmed_at" TIMESTAMP(3),
    "last_sign_in_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "licenseNumber" TEXT,
    "address" TEXT,
    "emergencyPhone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "emergencyContactName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mechanics" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "specialty" TEXT,
    "certifications" TEXT,
    "yearsOfExperience" INTEGER,
    "hourlyRate" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mechanics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "color" TEXT,
    "ownershipType" TEXT NOT NULL DEFAULT 'COMPANY_OWNED',
    "currentMileage" INTEGER NOT NULL DEFAULT 0,
    "status" "vehicle_status" NOT NULL DEFAULT 'ACTIVE',
    "currentDriverId" UUID,
    "purchasePrice" DECIMAL(14,2),
    "insuranceExpiry" TIMESTAMP(3),
    "roadworthinessExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "weeklyPayment" DECIMAL(14,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "assignment_status" NOT NULL DEFAULT 'ACTIVE',
    "handoverNotes" TEXT,
    "startOdometer" INTEGER,
    "endOdometer" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "receiptUrl" TEXT,
    "status" "deposit_status" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repairs" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reportedById" UUID NOT NULL,
    "mechanicId" UUID,
    "issueCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[],
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedOffAt" TIMESTAMP(3),
    "diagnosedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "fixedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "status" "repair_status" NOT NULL DEFAULT 'REPORTED',
    "diagnosisNotes" TEXT,
    "estimateCost" DECIMAL(14,2),
    "finalCost" DECIMAL(14,2),
    "mechanicNotes" TEXT,
    "completionPhotos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_items" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "totalCost" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "repairId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "receiptUrl" TEXT,
    "status" "expense_status" NOT NULL DEFAULT 'PENDING',
    "requestedById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "phone_number" TEXT,
    "token" TEXT NOT NULL,
    "status" "invitation_status" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "invited_by" UUID NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");
CREATE UNIQUE INDEX "user_profiles_phone_key" ON "user_profiles"("phone");
CREATE UNIQUE INDEX "drivers_userId_key" ON "drivers"("userId");
CREATE UNIQUE INDEX "mechanics_userId_key" ON "mechanics"("userId");
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber");
CREATE UNIQUE INDEX "deposits_assignmentId_weekStartDate_key" ON "deposits"("assignmentId", "weekStartDate");
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");
CREATE UNIQUE INDEX "invitations_email_key" ON "invitations"("email");
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_currentDriverId_fkey" FOREIGN KEY ("currentDriverId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "vehicle_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "repair_items" ADD CONSTRAINT "repair_items_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
