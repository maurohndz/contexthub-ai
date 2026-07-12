/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `prompt_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ai"."ai_usage_logs" DROP CONSTRAINT "ai_usage_logs_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."ai_usage_logs" DROP CONSTRAINT "ai_usage_logs_space_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."ai_usage_logs" DROP CONSTRAINT "ai_usage_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."conversations" DROP CONSTRAINT "conversations_space_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."conversations" DROP CONSTRAINT "conversations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."embeddings" DROP CONSTRAINT "embeddings_chunk_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."embeddings" DROP CONSTRAINT "embeddings_space_id_fkey";

-- DropForeignKey
ALTER TABLE "ai"."messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."ai_provider_credentials" DROP CONSTRAINT "ai_provider_credentials_created_by_fkey";

-- DropForeignKey
ALTER TABLE "main"."ai_provider_credentials" DROP CONSTRAINT "ai_provider_credentials_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."context_chunks" DROP CONSTRAINT "context_chunks_source_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."context_chunks" DROP CONSTRAINT "context_chunks_space_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."context_documents" DROP CONSTRAINT "context_documents_classification_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."context_documents" DROP CONSTRAINT "context_documents_source_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."context_documents" DROP CONSTRAINT "context_documents_space_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."context_sources" DROP CONSTRAINT "context_sources_space_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."organization_invitations" DROP CONSTRAINT "organization_invitations_invited_by_fkey";

-- DropForeignKey
ALTER TABLE "main"."organization_invitations" DROP CONSTRAINT "organization_invitations_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."organization_members" DROP CONSTRAINT "organization_members_invited_by_fkey";

-- DropForeignKey
ALTER TABLE "main"."organization_members" DROP CONSTRAINT "organization_members_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."organization_members" DROP CONSTRAINT "organization_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."organizations" DROP CONSTRAINT "organizations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "main"."space_tags" DROP CONSTRAINT "space_tags_space_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."space_tags" DROP CONSTRAINT "space_tags_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."spaces" DROP CONSTRAINT "spaces_created_by_fkey";

-- DropForeignKey
ALTER TABLE "main"."spaces" DROP CONSTRAINT "spaces_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "main"."tags" DROP CONSTRAINT "tags_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "parameters"."catalog_items" DROP CONSTRAINT "catalog_items_catalog_id_fkey";

-- DropForeignKey
ALTER TABLE "security"."api_keys" DROP CONSTRAINT "api_keys_user_id_fkey";

-- DropForeignKey
ALTER TABLE "security"."audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "security"."sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropIndex
DROP INDEX "ai"."idx_embeddings_space_id_model_name";

-- DropIndex
DROP INDEX "ai"."idx_embeddings_vector_hnsw";

-- DropIndex
DROP INDEX "main"."idx_ai_provider_credentials_organization_id";

-- AlterTable
ALTER TABLE "ai"."ai_usage_logs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ai"."conversations" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ai"."embeddings" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ai"."messages" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ai"."prompt_templates" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."ai_provider_credentials" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."context_chunks" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."context_documents" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."context_sources" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."organization_invitations" ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "accepted_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."organization_members" ALTER COLUMN "joined_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."organizations" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."space_tags" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."spaces" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "main"."tags" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "parameters"."catalog_items" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "parameters"."catalogs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "security"."api_keys" ALTER COLUMN "last_used_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "security"."audit_logs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "security"."sessions" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "revoked_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "security"."users" ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "email_verified_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_name_key" ON "ai"."prompt_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "main"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "security"."users"("email");

-- AddForeignKey
ALTER TABLE "security"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."ai_provider_credentials" ADD CONSTRAINT "ai_provider_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "main"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."ai_provider_credentials" ADD CONSTRAINT "ai_provider_credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "main"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "main"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."spaces" ADD CONSTRAINT "spaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "main"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."spaces" ADD CONSTRAINT "spaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."context_sources" ADD CONSTRAINT "context_sources_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."context_documents" ADD CONSTRAINT "context_documents_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "main"."context_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."context_documents" ADD CONSTRAINT "context_documents_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."context_documents" ADD CONSTRAINT "context_documents_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "parameters"."catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."context_chunks" ADD CONSTRAINT "context_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "main"."context_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."context_chunks" ADD CONSTRAINT "context_chunks_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "main"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."space_tags" ADD CONSTRAINT "space_tags_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."space_tags" ADD CONSTRAINT "space_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "main"."tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."embeddings" ADD CONSTRAINT "embeddings_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "main"."context_chunks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."embeddings" ADD CONSTRAINT "embeddings_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."conversations" ADD CONSTRAINT "conversations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai"."conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "main"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "main"."spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameters"."catalog_items" ADD CONSTRAINT "catalog_items_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "parameters"."catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ai"."idx_ai_usage_logs_org_id" RENAME TO "ai_usage_logs_organization_id_idx";

-- RenameIndex
ALTER INDEX "ai"."idx_ai_usage_logs_space_id" RENAME TO "ai_usage_logs_space_id_idx";

-- RenameIndex
ALTER INDEX "ai"."idx_ai_usage_logs_user_id" RENAME TO "ai_usage_logs_user_id_idx";

-- RenameIndex
ALTER INDEX "ai"."idx_conversations_space_id" RENAME TO "conversations_space_id_idx";

-- RenameIndex
ALTER INDEX "ai"."idx_embeddings_space_id" RENAME TO "embeddings_space_id_idx";

-- RenameIndex
ALTER INDEX "ai"."idx_messages_conversation_id" RENAME TO "messages_conversation_id_idx";

-- RenameIndex
ALTER INDEX "main"."uq_ai_provider_credentials" RENAME TO "ai_provider_credentials_organization_id_provider_key";

-- RenameIndex
ALTER INDEX "main"."idx_context_chunks_source_id" RENAME TO "context_chunks_source_id_idx";

-- RenameIndex
ALTER INDEX "main"."idx_context_chunks_space_id" RENAME TO "context_chunks_space_id_idx";

-- RenameIndex
ALTER INDEX "main"."idx_context_documents_classification_id" RENAME TO "context_documents_classification_id_idx";

-- RenameIndex
ALTER INDEX "main"."idx_context_documents_source_id" RENAME TO "context_documents_source_id_idx";

-- RenameIndex
ALTER INDEX "main"."idx_context_documents_space_id" RENAME TO "context_documents_space_id_idx";

-- RenameIndex
ALTER INDEX "main"."idx_context_sources_space_id" RENAME TO "context_sources_space_id_idx";

-- RenameIndex
ALTER INDEX "main"."idx_organization_members_user_id" RENAME TO "organization_members_user_id_idx";

-- RenameIndex
ALTER INDEX "main"."uq_organization_members" RENAME TO "organization_members_organization_id_user_id_key";

-- RenameIndex
ALTER INDEX "main"."uq_space_tags" RENAME TO "space_tags_space_id_tag_id_key";

-- RenameIndex
ALTER INDEX "main"."idx_spaces_organization_id" RENAME TO "spaces_organization_id_idx";

-- RenameIndex
ALTER INDEX "main"."uq_spaces_org_slug" RENAME TO "spaces_organization_id_slug_key";

-- RenameIndex
ALTER INDEX "main"."uq_tags_org_name" RENAME TO "tags_organization_id_name_key";

-- RenameIndex
ALTER INDEX "parameters"."idx_catalog_items_catalog_id" RENAME TO "catalog_items_catalog_id_idx";

-- RenameIndex
ALTER INDEX "security"."idx_api_keys_user_id" RENAME TO "api_keys_user_id_idx";

-- RenameIndex
ALTER INDEX "security"."idx_audit_logs_entity" RENAME TO "audit_logs_entity_type_entity_id_idx";

-- RenameIndex
ALTER INDEX "security"."idx_audit_logs_user_id" RENAME TO "audit_logs_user_id_idx";

-- RenameIndex
ALTER INDEX "security"."idx_sessions_user_id" RENAME TO "sessions_user_id_idx";
