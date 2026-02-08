package com.astba.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "app_settings")
public class AppSetting {
    @Id
    @Column(length = 100)
    private String key;

    @Column(length = 255, nullable = false)
    private String value;
}
