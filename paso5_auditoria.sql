-- =============================================================================
-- PASO 5 - Auditoría de sesiones (login / logout) y reportes de auditoría
-- Ejecutar contra la base bar_app, DESPUÉS de seed.sql y paso1_reservas.sql.
-- =============================================================================
USE bar_app;

-- -----------------------------------------------------------------------------
-- 1) Tabla de auditoría de sesiones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria_sesion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(20) NOT NULL,              -- LOGIN | LOGIN_FALLIDO | LOGOUT
  `usuarioId` int DEFAULT NULL,
  `correo` varchar(255) NOT NULL,
  `detalle` varchar(255) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_auditoria_sesion_fecha` (`fecha`),
  KEY `FK_auditoria_sesion_usuario` (`usuarioId`),
  CONSTRAINT `FK_auditoria_sesion_usuario` FOREIGN KEY (`usuarioId`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2) Formulario "Auditoria" dentro del módulo Seguridad, con sus acciones
-- -----------------------------------------------------------------------------
INSERT INTO `formulario` (`nombre`, `modulo_id`)
SELECT 'Auditoria', m.id
FROM `modulo` m
WHERE m.nombre = 'Seguridad'
  AND NOT EXISTS (SELECT 1 FROM `formulario` f WHERE f.nombre = 'Auditoria');

INSERT INTO `accion` (`nombre`)
SELECT x.nombre
FROM (
  SELECT 'Ver Auditoria de Sesiones' AS nombre
  UNION ALL SELECT 'Ver Auditoria de Reservas'
) x
WHERE NOT EXISTS (SELECT 1 FROM `accion` a WHERE a.nombre = x.nombre);

INSERT IGNORE INTO `accion_formulario` (`accion_id`, `formulario_id`)
SELECT a.id, f.id
FROM `accion` a
JOIN `formulario` f ON f.nombre = 'Auditoria'
WHERE a.nombre IN ('Ver Auditoria de Sesiones', 'Ver Auditoria de Reservas');

-- Solo Admin ve la auditoría (se puede asignar a otros grupos desde Seguridad)
INSERT IGNORE INTO `grupo_formulario` (`grupo_id`, `formulario_id`)
SELECT g.id, f.id
FROM `grupo` g
JOIN `formulario` f ON f.nombre = 'Auditoria'
WHERE g.nombre = 'Admin';

-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
SELECT f.nombre AS formulario, a.nombre AS accion
FROM `formulario` f
JOIN `accion_formulario` af ON af.formulario_id = f.id
JOIN `accion` a ON a.id = af.accion_id
WHERE f.nombre = 'Auditoria';
