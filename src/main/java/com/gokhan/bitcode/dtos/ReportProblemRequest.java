package com.gokhan.bitcode.dtos;

import com.gokhan.bitcode.enums.ReportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportProblemRequest {
    @NotBlank(message = "Problem UID boş olamaz")
    private String problemUid;

    @NotBlank(message = "Geri bildirim boş olamaz")
    @Size(min = 10, max = 1000, message = "Geri bildirim 10-1000 karakter arasında olmalıdır")
    private String feedback;

    @NotNull(message = "Kategori seçilmelidir")
    private ReportCategory category;
}

