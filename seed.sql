-- =============================================================================
-- Seed: Módulos, Formularios, Acciones, Grupos y enlaces
-- Ejecutar contra la base bar_app (MySQL).
-- Desactiva FKs, borra tablas de seguridad, las recrea e inserta los datos.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas (orden: tablas de enlace primero, luego entidades con FKs)
DROP TABLE IF EXISTS `usuario_grupo`;
DROP TABLE IF EXISTS `grupo_accion`;
DROP TABLE IF EXISTS `grupo_formulario`;
DROP TABLE IF EXISTS `grupo_jerarquia`;
DROP TABLE IF EXISTS `accion_formulario`;
DROP TABLE IF EXISTS `accion`;
DROP TABLE IF EXISTS `formulario`;
DROP TABLE IF EXISTS `grupo`;
DROP TABLE IF EXISTS `modulo`;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Crear tablas (estructura alineada con las entidades TypeORM)
-- -----------------------------------------------------------------------------

CREATE TABLE `modulo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `formulario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `modulo_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_formulario_modulo` (`modulo_id`),
  CONSTRAINT `FK_formulario_modulo` FOREIGN KEY (`modulo_id`) REFERENCES `modulo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `accion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `accion_formulario` (
  `accion_id` int NOT NULL,
  `formulario_id` int NOT NULL,
  PRIMARY KEY (`accion_id`, `formulario_id`),
  KEY `FK_accion_formulario_formulario` (`formulario_id`),
  CONSTRAINT `FK_accion_formulario_accion` FOREIGN KEY (`accion_id`) REFERENCES `accion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_accion_formulario_formulario` FOREIGN KEY (`formulario_id`) REFERENCES `formulario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `grupo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `estaActivo` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `grupo_formulario` (
  `grupo_id` int NOT NULL,
  `formulario_id` int NOT NULL,
  PRIMARY KEY (`grupo_id`, `formulario_id`),
  KEY `FK_grupo_formulario_formulario` (`formulario_id`),
  CONSTRAINT `FK_grupo_formulario_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `grupo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_grupo_formulario_formulario` FOREIGN KEY (`formulario_id`) REFERENCES `formulario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `grupo_jerarquia` (
  `grupo_padre_id` int NOT NULL,
  `grupo_hijo_id` int NOT NULL,
  PRIMARY KEY (`grupo_padre_id`, `grupo_hijo_id`),
  KEY `FK_grupo_jerarquia_hijo` (`grupo_hijo_id`),
  CONSTRAINT `FK_grupo_jerarquia_padre` FOREIGN KEY (`grupo_padre_id`) REFERENCES `grupo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_grupo_jerarquia_hijo` FOREIGN KEY (`grupo_hijo_id`) REFERENCES `grupo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- usuario_grupo: requiere que exista la tabla user; se crea sin FK si no quieres tocar user
CREATE TABLE IF NOT EXISTS `usuario_grupo` (
  `usuario_id` int NOT NULL,
  `grupo_id` int NOT NULL,
  PRIMARY KEY (`usuario_id`, `grupo_id`),
  KEY `FK_usuario_grupo_grupo` (`grupo_id`),
  CONSTRAINT `FK_usuario_grupo_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `grupo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Si tu tabla de usuarios se llama 'user' y quieres FK hacia ella, descomenta y ajusta:
-- ALTER TABLE `usuario_grupo` ADD CONSTRAINT `FK_usuario_grupo_user` FOREIGN KEY (`usuario_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- Insertar módulos (ids como en tu especificación)
-- -----------------------------------------------------------------------------

INSERT INTO `modulo` (`id`, `nombre`) VALUES
(1, 'Reservas'),
(2, 'Pedidos'),
(3, 'Reportes'),
(5, 'Mesas'),
(6, 'Productos'),
(7, 'Categorias'),
(8, 'Realizar Pedidos'),
(9, 'Seguridad');

-- -----------------------------------------------------------------------------
-- Insertar formularios (id, nombre, modulo_id)
-- -----------------------------------------------------------------------------

INSERT INTO `formulario` (`id`, `nombre`, `modulo_id`) VALUES
(1, 'Gestionar Mesas', 5),
(2, 'Gestionar Pedidos', 2),
(3, 'Gestionar Productos', 6),
(4, 'Gestionar Categorias', 7),
(5, 'Visualizar Reportes', 3),
(6, 'Gestionar Usuarios', 9),
(7, 'Gestionar Grupos', 9),
(8, 'Gestionar Modulos', 9),
(9, 'Gestionar Formularios', 9),
(10, 'Ver Acciones', 9);

-- -----------------------------------------------------------------------------
-- Insertar acciones (id, nombre)
-- -----------------------------------------------------------------------------

INSERT INTO `accion` (`id`, `nombre`) VALUES
(1, 'Agregar Producto'),
(2, 'Editar Producto'),
(3, 'Eliminar Producto'),
(4, 'Ver Productos'),
(5, 'Agregar Categoria'),
(6, 'Editar Categoria'),
(7, 'Eliminar Categoria'),
(8, 'Ver Categorias'),
(9, 'Abrir Mesa'),
(10, 'Cerrar Mesa'),
(11, 'Eliminar Mesa'),
(12, 'Ver Pedidos'),
(13, 'Editar Pedido'),
(14, 'Cambiar Estado de Pedido'),
(15, 'Crear Pedido'),
(16, 'Ver Pedidos'),
(17, 'Confirmar Pedido'),
(18, 'Rechazar Pedido'),
(19, 'Ver Reportes'),
(20, 'Exportar Reportes'),
(21, 'Crear Usuario'),
(22, 'Editar Usuario'),
(23, 'Eliminar Usuario'),
(24, 'Ver Usuarios'),
(25, 'Crear Grupo'),
(26, 'Editar Grupo'),
(27, 'Eliminar Grupo'),
(28, 'Ver Grupos'),
(29, 'Crear Modulo'),
(30, 'Editar Modulo'),
(31, 'Eliminar Modulo'),
(32, 'Ver Modulos'),
(33, 'Crear Formulario'),
(34, 'Editar Formulario'),
(35, 'Eliminar Formulario'),
(36, 'Ver Formularios'),
(37, 'Ver Acciones'),
(38, 'Ver Historial de Pedidos'),
(39, 'Imprimir Ticket'),
(40, 'Ver Productos Mas Pedidos'),
(41, 'Ver Productos Menos Pedidos'),
(42, 'Ver Productos Nunca Pedidos'),
(43, 'Reporte de Ingresos'),
(44, 'Ticket Promedio');

-- -----------------------------------------------------------------------------
-- Enlazar accion_formulario (accion_id, formulario_id) - una acción puede estar en uno o varios formularios
-- -----------------------------------------------------------------------------

INSERT INTO `accion_formulario` (`accion_id`, `formulario_id`) VALUES
(1, 3), (2, 3), (3, 3), (4, 3),
(5, 4), (6, 4), (7, 4), (8, 4),
(9, 1), (10, 1), (11, 1), (12, 1), (13, 1), (14, 1), (38, 1), (39, 1),
(15, 2), (16, 2), (17, 2), (18, 2),
(19, 5), (20, 5), (40, 5), (41, 5), (42, 5), (43, 5), (44, 5),
(21, 6), (22, 6), (23, 6), (24, 6),
(25, 7), (26, 7), (27, 7), (28, 7),
(29, 8), (30, 8), (31, 8), (32, 8),
(33, 9), (34, 9), (35, 9), (36, 9),
(37, 10);

-- -----------------------------------------------------------------------------
-- Insertar grupos (id, nombre, estaActivo)
-- -----------------------------------------------------------------------------

INSERT INTO `grupo` (`id`, `nombre`, `estaActivo`) VALUES
(1, 'Mozo', 1),
(2, 'Encargado', 1),
(3, 'Admin', 1);

-- -----------------------------------------------------------------------------
-- Enlazar grupo_formulario (grupo_id, formulario_id)
-- Mozo (1): formularios 1 Gestionar Mesas, 2 Gestionar Pedidos, 3 Gestionar Productos, 4 Gestionar Categorias
-- Encargado (2): formularios 2 Gestionar Pedidos, 5 Visualizar Reportes
-- Admin (3): todos los formularios 1..10 (todos los privilegios)
-- -----------------------------------------------------------------------------

INSERT INTO `grupo_formulario` (`grupo_id`, `formulario_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 2), (2, 5),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10);

-- -----------------------------------------------------------------------------
-- Enlazar usuario 3 con grupo 3 (Admin)
-- -----------------------------------------------------------------------------

INSERT INTO `usuario_grupo` (`usuario_id`, `grupo_id`) VALUES (3, 3);
