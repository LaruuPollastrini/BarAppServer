-- =============================================================================
-- PASO 6 - Reportes del core de reservas
-- Agrega 2 acciones al formulario "Visualizar Reportes" (módulo Reportes).
-- Las ven los grupos que ya tienen ese formulario (Admin y Encargado).
-- =============================================================================
USE bar_app;

INSERT INTO `accion` (`nombre`)
SELECT x.nombre
FROM (
  SELECT 'Ver Reporte de Ocupacion' AS nombre
  UNION ALL SELECT 'Ver Reporte de Estados de Reservas'
) x
WHERE NOT EXISTS (SELECT 1 FROM `accion` a WHERE a.nombre = x.nombre);

INSERT IGNORE INTO `accion_formulario` (`accion_id`, `formulario_id`)
SELECT a.id, f.id
FROM `accion` a
JOIN `formulario` f ON f.nombre = 'Visualizar Reportes'
WHERE a.nombre IN ('Ver Reporte de Ocupacion', 'Ver Reporte de Estados de Reservas');

-- Verificación
SELECT f.nombre AS formulario, a.nombre AS accion
FROM `formulario` f
JOIN `accion_formulario` af ON af.formulario_id = f.id
JOIN `accion` a ON a.id = af.accion_id
WHERE f.nombre = 'Visualizar Reportes'
ORDER BY a.nombre;
