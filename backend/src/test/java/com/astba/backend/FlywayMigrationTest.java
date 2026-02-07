package com.astba.backend;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationTest {

    @Test
    void migrationsApplyOnFreshDatabase() {
        Flyway flyway = Flyway.configure()
                .dataSource("jdbc:h2:mem:flyway;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "")
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();

        flyway.clean();
        MigrateResult result = flyway.migrate();

        assertThat(result.migrationsExecuted).isGreaterThan(0);
        assertThat(flyway.info().current()).isNotNull();
    }
}
