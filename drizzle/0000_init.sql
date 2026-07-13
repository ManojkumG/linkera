CREATE TYPE "public"."sharkhire_experience_level" AS ENUM('internship', 'entry', 'mid', 'senior', 'lead', 'principal');--> statement-breakpoint
CREATE TYPE "public"."sharkhire_request_status" AS ENUM('requested', 'viewed', 'under_review', 'referred', 'accepted', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."sharkhire_user_role" AS ENUM('seeker', 'employee', 'admin');--> statement-breakpoint
CREATE TYPE "public"."sharkhire_verification_method" AS ENUM('company_email', 'work_email_otp', 'linkedin', 'manual');--> statement-breakpoint
CREATE TYPE "public"."sharkhire_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."sharkhire_work_mode" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TABLE "sharkhire_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "sharkhire_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sharkhire_employee_profile" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"companyDomain" varchar(255),
	"department" varchar(255),
	"title" varchar(255),
	"location" varchar(255),
	"work_mode" "sharkhire_work_mode" DEFAULT 'onsite',
	"experience_level" "sharkhire_experience_level" DEFAULT 'mid',
	"yearsExperience" integer DEFAULT 0,
	"bio" text,
	"linkedinUrl" varchar(512),
	"verification_method" "sharkhire_verification_method",
	"verification_status" "sharkhire_verification_status" DEFAULT 'unverified' NOT NULL,
	"verifiedAt" timestamp with time zone,
	"avgResponseHours" integer,
	"ratingSum" integer DEFAULT 0 NOT NULL,
	"ratingCount" integer DEFAULT 0 NOT NULL,
	"totalReferred" integer DEFAULT 0 NOT NULL,
	"totalHired" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sharkhire_notification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"type" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"link" varchar(512),
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharkhire_referral_listing" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"employeeId" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"department" varchar(255),
	"role" varchar(255) NOT NULL,
	"jobTitle" varchar(255),
	"location" varchar(255),
	"work_mode" "sharkhire_work_mode" DEFAULT 'onsite',
	"experience_level" "sharkhire_experience_level" DEFAULT 'mid',
	"description" text,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"priceInr" integer DEFAULT 0 NOT NULL,
	"monthlyLimit" integer DEFAULT 5 NOT NULL,
	"slotsUsedThisMonth" integer DEFAULT 0 NOT NULL,
	"slotsResetAt" timestamp with time zone,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sharkhire_referral_request" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"listingId" varchar(255) NOT NULL,
	"seekerId" varchar(255) NOT NULL,
	"employeeId" varchar(255) NOT NULL,
	"resumeId" varchar(255),
	"status" "sharkhire_request_status" DEFAULT 'requested' NOT NULL,
	"message" text,
	"coverLetter" text,
	"priceInr" integer DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"successScore" integer,
	"statusHistory" jsonb DEFAULT '[]'::jsonb,
	"viewedAt" timestamp with time zone,
	"referredAt" timestamp with time zone,
	"decidedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sharkhire_resume" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"fileName" varchar(512) NOT NULL,
	"mimeType" varchar(128),
	"content" text,
	"parsed" jsonb,
	"atsScore" integer,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharkhire_review" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"requestId" varchar(255) NOT NULL,
	"authorId" varchar(255) NOT NULL,
	"employeeId" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharkhire_seeker_profile" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"headline" varchar(255),
	"location" varchar(255),
	"work_mode_preference" "sharkhire_work_mode",
	"experience_level" "sharkhire_experience_level" DEFAULT 'entry',
	"yearsExperience" integer DEFAULT 0,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"education" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"projects" jsonb DEFAULT '[]'::jsonb,
	"careerGoals" text,
	"targetCompanies" jsonb DEFAULT '[]'::jsonb,
	"openToRelocate" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sharkhire_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharkhire_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"role" "sharkhire_user_role" DEFAULT 'seeker' NOT NULL,
	"passwordHash" varchar(255),
	"onboardedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharkhire_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sharkhire_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "sharkhire_account" ADD CONSTRAINT "sharkhire_account_userId_sharkhire_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_employee_profile" ADD CONSTRAINT "sharkhire_employee_profile_userId_sharkhire_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_notification" ADD CONSTRAINT "sharkhire_notification_userId_sharkhire_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_referral_listing" ADD CONSTRAINT "sharkhire_referral_listing_employeeId_sharkhire_user_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_referral_request" ADD CONSTRAINT "sharkhire_referral_request_listingId_sharkhire_referral_listing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."sharkhire_referral_listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_referral_request" ADD CONSTRAINT "sharkhire_referral_request_seekerId_sharkhire_user_id_fk" FOREIGN KEY ("seekerId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_referral_request" ADD CONSTRAINT "sharkhire_referral_request_employeeId_sharkhire_user_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_referral_request" ADD CONSTRAINT "sharkhire_referral_request_resumeId_sharkhire_resume_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."sharkhire_resume"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_resume" ADD CONSTRAINT "sharkhire_resume_userId_sharkhire_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_review" ADD CONSTRAINT "sharkhire_review_requestId_sharkhire_referral_request_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."sharkhire_referral_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_review" ADD CONSTRAINT "sharkhire_review_authorId_sharkhire_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_review" ADD CONSTRAINT "sharkhire_review_employeeId_sharkhire_user_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_seeker_profile" ADD CONSTRAINT "sharkhire_seeker_profile_userId_sharkhire_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharkhire_session" ADD CONSTRAINT "sharkhire_session_userId_sharkhire_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharkhire_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "sharkhire_account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_profile_user_id_idx" ON "sharkhire_employee_profile" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "employee_profile_company_idx" ON "sharkhire_employee_profile" USING btree ("company");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "sharkhire_notification" USING btree ("userId","isRead");--> statement-breakpoint
CREATE INDEX "referral_listing_employee_idx" ON "sharkhire_referral_listing" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "referral_listing_company_idx" ON "sharkhire_referral_listing" USING btree ("company");--> statement-breakpoint
CREATE INDEX "referral_listing_active_idx" ON "sharkhire_referral_listing" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "referral_request_seeker_idx" ON "sharkhire_referral_request" USING btree ("seekerId");--> statement-breakpoint
CREATE INDEX "referral_request_employee_idx" ON "sharkhire_referral_request" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "referral_request_listing_idx" ON "sharkhire_referral_request" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "referral_request_status_idx" ON "sharkhire_referral_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resume_user_id_idx" ON "sharkhire_resume" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "review_request_idx" ON "sharkhire_review" USING btree ("requestId");--> statement-breakpoint
CREATE INDEX "review_employee_idx" ON "sharkhire_review" USING btree ("employeeId");--> statement-breakpoint
CREATE UNIQUE INDEX "seeker_profile_user_id_idx" ON "sharkhire_seeker_profile" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sharkhire_session" USING btree ("userId");