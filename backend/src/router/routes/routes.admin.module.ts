import { Module } from '@nestjs/common';
import { AdminUsersModule } from 'src/modules/admin-users/admin-users.module';
import { AdminUsersController } from 'src/modules/admin-users/controllers/admin-users.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { AuditLogAdminController } from 'src/modules/audit-log/controllers/audit-log.admin.controller';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { AdminPanelModule } from 'src/modules/admin-panel/admin-panel.module';
import { AdminOverviewController } from 'src/modules/admin-panel/controllers/admin-overview.controller';
import { AdminUsersPanelController } from 'src/modules/admin-panel/controllers/admin-users-panel.controller';
import { AdminConnectionsController } from 'src/modules/admin-panel/controllers/admin-connections.controller';
import { AdminJobsController } from 'src/modules/admin-panel/controllers/admin-jobs.controller';
import { AdminComplianceLogsController } from 'src/modules/admin-panel/controllers/admin-compliance-logs.controller';
import { AdminAuditLogsController } from 'src/modules/admin-panel/controllers/admin-audit-logs.controller';
import { AdminAlertsController } from 'src/modules/admin-panel/controllers/admin-alerts.controller';
import { AdminRecommendationsController } from 'src/modules/admin-panel/controllers/admin-recommendations.controller';
import { AdminHealthController } from 'src/modules/admin-panel/controllers/admin-health.controller';
import { AdminFeatureFlagsController } from 'src/modules/admin-panel/controllers/admin-feature-flags.controller';

@Module({
    controllers: [
        AdminUsersController,
        AuditLogAdminController,
        AdminOverviewController,
        AdminUsersPanelController,
        AdminConnectionsController,
        AdminJobsController,
        AdminComplianceLogsController,
        AdminAuditLogsController,
        AdminAlertsController,
        AdminRecommendationsController,
        AdminHealthController,
        AdminFeatureFlagsController,
    ],
    providers: [],
    exports: [],
    imports: [AdminUsersModule, AuditLogModule, UsersModule, AdminPanelModule],
})
export class RoutesAdminModule {}
