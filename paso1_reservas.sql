-- =============================================================================
-- PASO 1 - Core 2 "Realizar reserva"
-- Ejecutar contra la base bar_app (MySQL), DESPUÉS de seed.sql.
--
-- 1) Recrea las tablas agenda, reserva y reserva_historial.
--    ATENCIÓN: borra los datos de prueba que hubiera en esas 3 tablas.
-- 2) Carga formularios y acciones del módulo "Reservas" (sin duplicar si ya existen).
-- 3) Crea el grupo "Cliente" y asigna formularios a los grupos.
-- 4) Asigna el grupo "Cliente" a los usuarios que hoy no tienen ningún grupo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Tablas
-- -----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `reserva_historial`;
DROP TABLE IF EXISTS `reserva`;
DROP TABLE IF EXISTS `agenda`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `agenda` (
  `idAgenda` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `horario` time NOT NULL,
  `capacidad` int NOT NULL,
  `estaActiva` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`idAgenda`),
  UNIQUE KEY `UQ_agenda_fecha_horario` (`fecha`, `horario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reserva` (
  `idReserva` int NOT NULL AUTO_INCREMENT,
  `cantidadPersonas` int NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'Pendiente',
  `fechaSolicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `clienteId` int NOT NULL,
  `agendaId` int NOT NULL,
  PRIMARY KEY (`idReserva`),
  KEY `FK_reserva_cliente` (`clienteId`),
  KEY `FK_reserva_agenda` (`agendaId`),
  CONSTRAINT `FK_reserva_cliente` FOREIGN KEY (`clienteId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_reserva_agenda` FOREIGN KEY (`agendaId`) REFERENCES `agenda` (`idAgenda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reserva_historial` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `reservaId` int NOT NULL,
  `estadoAnterior` varchar(50) DEFAULT NULL,
  `estadoNuevo` varchar(50) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuarioId` int DEFAULT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `FK_historial_reserva` (`reservaId`),
  KEY `FK_historial_usuario` (`usuarioId`),
  CONSTRAINT `FK_historial_reserva` FOREIGN KEY (`reservaId`) REFERENCES `reserva` (`idReserva`) ON DELETE CASCADE,
  CONSTRAINT `FK_historial_usuario` FOREIGN KEY (`usuarioId`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2) Formularios del módulo "Reservas"
--    Los permisos se asignan a los grupos POR FORMULARIO, por eso se separan así:
--    - Realizar Reserva   -> lo que hace el cliente
--    - Gestionar Agenda   -> publicar turnos (fecha, horario, capacidad)
--    - Gestionar Reservas -> aceptar / rechazar reservas
--    - Recibir Reservas   -> cerrar la reserva cuando el cliente llega (ej. un mozo)
-- -----------------------------------------------------------------------------
INSERT INTO `formulario` (`nombre`, `modulo_id`)
SELECT x.nombre, m.id
FROM (
  SELECT 'Realizar Reserva' AS nombre
  UNION ALL SELECT 'Gestionar Agenda'
  UNION ALL SELECT 'Gestionar Reservas'
  UNION ALL SELECT 'Recibir Reservas'
) x
JOIN `modulo` m ON m.nombre = 'Reservas'
WHERE NOT EXISTS (SELECT 1 FROM `formulario` f WHERE f.nombre = x.nombre);

-- Acciones (nombres únicos: el guard también compara solo por nombre de acción)
INSERT INTO `accion` (`nombre`)
SELECT x.nombre
FROM (
  SELECT 'Ver Disponibilidad' AS nombre
  UNION ALL SELECT 'Crear Reserva'
  UNION ALL SELECT 'Ver Mis Reservas'
  UNION ALL SELECT 'Cancelar Mi Reserva'
  UNION ALL SELECT 'Ver Agenda'
  UNION ALL SELECT 'Cargar Disponibilidad'
  UNION ALL SELECT 'Eliminar Disponibilidad'
  UNION ALL SELECT 'Ver Reservas'
  UNION ALL SELECT 'Aceptar Reserva'
  UNION ALL SELECT 'Rechazar Reserva'
  UNION ALL SELECT 'Ver Reservas del Dia'
  UNION ALL SELECT 'Cerrar Reserva'
) x
WHERE NOT EXISTS (SELECT 1 FROM `accion` a WHERE a.nombre = x.nombre);

-- Enlace acción -> formulario
INSERT IGNORE INTO `accion_formulario` (`accion_id`, `formulario_id`)
SELECT a.id, f.id
FROM (
  SELECT 'Ver Disponibilidad' AS accion, 'Realizar Reserva' AS formulario
  UNION ALL SELECT 'Crear Reserva',           'Realizar Reserva'
  UNION ALL SELECT 'Ver Mis Reservas',        'Realizar Reserva'
  UNION ALL SELECT 'Cancelar Mi Reserva',     'Realizar Reserva'
  UNION ALL SELECT 'Ver Agenda',              'Gestionar Agenda'
  UNION ALL SELECT 'Cargar Disponibilidad',   'Gestionar Agenda'
  UNION ALL SELECT 'Eliminar Disponibilidad', 'Gestionar Agenda'
  UNION ALL SELECT 'Ver Reservas',            'Gestionar Reservas'
  UNION ALL SELECT 'Aceptar Reserva',         'Gestionar Reservas'
  UNION ALL SELECT 'Rechazar Reserva',        'Gestionar Reservas'
  UNION ALL SELECT 'Ver Reservas del Dia',    'Recibir Reservas'
  UNION ALL SELECT 'Cerrar Reserva',          'Recibir Reservas'
) x
JOIN `accion` a ON a.nombre = x.accion
JOIN `formulario` f ON f.nombre = x.formulario;

-- -----------------------------------------------------------------------------
-- 3) Grupo "Cliente" y asignación de formularios a grupos
--    (después se puede cambiar todo desde el módulo de seguridad)
-- -----------------------------------------------------------------------------
INSERT INTO `grupo` (`nombre`, `estaActivo`)
SELECT 'Cliente', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `grupo` g WHERE g.nombre = 'Cliente');

INSERT IGNORE INTO `grupo_formulario` (`grupo_id`, `formulario_id`)
SELECT g.id, f.id
FROM (
  SELECT 'Cliente' AS grupo, 'Realizar Reserva' AS formulario
  UNION ALL SELECT 'Admin',     'Gestionar Agenda'
  UNION ALL SELECT 'Admin',     'Gestionar Reservas'
  UNION ALL SELECT 'Admin',     'Recibir Reservas'
  UNION ALL SELECT 'Encargado', 'Gestionar Agenda'
  UNION ALL SELECT 'Encargado', 'Gestionar Reservas'
  UNION ALL SELECT 'Encargado', 'Recibir Reservas'
  UNION ALL SELECT 'Mozo',      'Recibir Reservas'
) x
JOIN `grupo` g ON g.nombre = x.grupo
JOIN `formulario` f ON f.nombre = x.formulario;

-- -----------------------------------------------------------------------------
-- 4) Usuarios ya registrados sin ningún grupo -> pasan a ser "Cliente"
-- -----------------------------------------------------------------------------
INSERT INTO `usuario_grupo` (`usuario_id`, `grupo_id`)
SELECT u.id, g.id
FROM `user` u
JOIN `grupo` g ON g.nombre = 'Cliente'
WHERE NOT EXISTS (SELECT 1 FROM `usuario_grupo` ug WHERE ug.usuario_id = u.id);

-- -----------------------------------------------------------------------------
-- Verificación rápida
-- -----------------------------------------------------------------------------
SELECT f.nombre AS formulario, a.nombre AS accion
FROM `formulario` f
JOIN `modulo` m ON m.id = f.modulo_id AND m.nombre = 'Reservas'
JOIN `accion_formulario` af ON af.formulario_id = f.id
JOIN `accion` a ON a.id = af.accion_id
ORDER BY f.nombre, a.nombre;
