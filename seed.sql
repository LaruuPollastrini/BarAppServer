-- =============================================================================
-- Seed: Módulos, Formularios, Acciones, Grupos y enlaces
-- Ejecutar contra la base bar_app (MySQL).
-- Desactiva FKs, borra tablas de seguridad, las recrea e inserta los datos.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas (orden: tablas de enlace primero, luego entidades con FKs)
-- Para reset completo de categoria/producto, descomenta:
-- DROP TABLE IF EXISTS `detallespedido`;
-- DROP TABLE IF EXISTS `detalles_pedido`;
-- DROP TABLE IF EXISTS `producto`;
-- DROP TABLE IF EXISTS `categoria`;
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
-- Categoria y Producto (realizar-pedidos)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `estaEliminado` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_categoria_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //
DROP PROCEDURE IF EXISTS alter_categoria_add_columns//
CREATE PROCEDURE alter_categoria_add_columns()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categoria' AND COLUMN_NAME = 'descripcion') = 0 THEN
    ALTER TABLE `categoria` ADD COLUMN `descripcion` varchar(500) DEFAULT NULL;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categoria' AND COLUMN_NAME = 'estaEliminado') = 0 THEN
    ALTER TABLE `categoria` ADD COLUMN `estaEliminado` tinyint NOT NULL DEFAULT 0;
  END IF;
END//
DELIMITER ;
CALL alter_categoria_add_columns();
DROP PROCEDURE IF EXISTS alter_categoria_add_columns;

CREATE TABLE IF NOT EXISTS `producto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoriaId` int NULL DEFAULT NULL,
  `estaEliminado` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `FK_producto_categoria` (`categoriaId`),
  CONSTRAINT `FK_producto_categoria` FOREIGN KEY (`categoriaId`) REFERENCES `categoria` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //
DROP PROCEDURE IF EXISTS alter_producto_add_columns//
CREATE PROCEDURE alter_producto_add_columns()
BEGIN
  DECLARE fk_name VARCHAR(255) DEFAULT NULL;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto' AND COLUMN_NAME = 'categoria_id') > 0 THEN
    IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto' AND COLUMN_NAME = 'categoriaId') = 0 THEN
      ALTER TABLE `producto` ADD COLUMN `categoriaId` int NULL DEFAULT NULL;
      UPDATE `producto` SET `categoriaId` = `categoria_id` WHERE `categoria_id` IS NOT NULL;
    END IF;
    SELECT CONSTRAINT_NAME INTO fk_name FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto' AND COLUMN_NAME = 'categoria_id' AND REFERENCED_TABLE_NAME = 'categoria' LIMIT 1;
    IF fk_name IS NOT NULL THEN
      SET @sql = CONCAT('ALTER TABLE `producto` DROP FOREIGN KEY `', fk_name, '`');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
    ALTER TABLE `producto` DROP COLUMN `categoria_id`;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto' AND COLUMN_NAME = 'categoriaId') = 0 THEN
    ALTER TABLE `producto` ADD COLUMN `categoriaId` int NULL DEFAULT NULL;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto' AND CONSTRAINT_NAME = 'FK_producto_categoria') = 0 THEN
    ALTER TABLE `producto` ADD CONSTRAINT `FK_producto_categoria` FOREIGN KEY (`categoriaId`) REFERENCES `categoria` (`id`);
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto' AND COLUMN_NAME = 'estaEliminado') = 0 THEN
    ALTER TABLE `producto` ADD COLUMN `estaEliminado` tinyint NOT NULL DEFAULT 0;
  END IF;
END//
DELIMITER ;
CALL alter_producto_add_columns();
DROP PROCEDURE IF EXISTS alter_producto_add_columns;

INSERT INTO `categoria` (`id`, `nombre`, `descripcion`, `estaEliminado`) VALUES
(1, 'Bebidas', 'Bebidas frías y calientes', 0),
(2, 'Comidas', 'Platos principales y acompañamientos', 0),
(3, 'Postres', 'Dulces y postres', 0),
(4, 'Snacks', 'Aperitivos y snacks', 0)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `descripcion` = VALUES(`descripcion`), `estaEliminado` = VALUES(`estaEliminado`);

INSERT INTO `producto` (`id`, `nombre`, `descripcion`, `precio`, `categoriaId`, `estaEliminado`) VALUES
(1, 'Café Americano', 'Café negro americano', 2.50, 1, 0),
(2, 'Café con Leche', 'Café con leche caliente', 3.00, 1, 0),
(3, 'Coca Cola', 'Gaseosa 500ml', 2.00, 1, 0),
(4, 'Agua Mineral', 'Agua mineral 500ml', 1.50, 1, 0),
(5, 'Cerveza', 'Cerveza rubia 330ml', 4.00, 1, 0),
(6, 'Milanesa Napolitana', 'Milanesa con jamón, queso y salsa', 12.00, 2, 0),
(7, 'Pizza Margherita', 'Pizza con tomate y mozzarella', 10.00, 2, 0),
(8, 'Hamburguesa Clásica', 'Hamburguesa con papas fritas', 9.50, 2, 0),
(9, 'Ensalada César', 'Lechuga, pollo, crutones y aderezo', 8.00, 2, 0),
(10, 'Flan con Dulce de Leche', 'Flan casero con dulce de leche', 5.00, 3, 0),
(11, 'Brownie', 'Brownie de chocolate con nueces', 4.50, 3, 0),
(12, 'Helado 2 Bochas', 'Helado artesanal 2 bochas', 4.00, 3, 0),
(13, 'Papas Fritas', 'Porción de papas fritas', 3.50, 4, 0),
(14, 'Nachos con Queso', 'Nachos con salsa de queso', 5.50, 4, 0),
(15, 'Empanadas x3', 'Tres empanadas de carne', 6.00, 4, 0)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `descripcion` = VALUES(`descripcion`), `precio` = VALUES(`precio`), `categoriaId` = VALUES(`categoriaId`), `estaEliminado` = VALUES(`estaEliminado`);

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
(44, 'Ticket Promedio'),
(45, 'Ver Mesa');

-- -----------------------------------------------------------------------------
-- Enlazar accion_formulario (accion_id, formulario_id) - una acción puede estar en uno o varios formularios
-- -----------------------------------------------------------------------------

INSERT INTO `accion_formulario` (`accion_id`, `formulario_id`) VALUES
(1, 3), (2, 3), (3, 3), (4, 3),
(5, 4), (6, 4), (7, 4), (8, 4),
(9, 1), (10, 1), (11, 1), (12, 1), (13, 1), (14, 1), (38, 1), (39, 1), (45, 1),
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
