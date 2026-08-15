--
-- PostgreSQL database dump
--

\restrict Mx8cefFOvC2DppiVD7P0Db08nCoS2rVr5gdleqOXEZneugY00uqftTtIRNkmKUv

-- Dumped from database version 16.14 (Homebrew)
-- Dumped by pg_dump version 16.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acompanante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acompanante (
    "ID_ACOMPANANTE" integer NOT NULL,
    "FK_ADMISION" character varying(50) NOT NULL,
    "NOMBRE_ACOMPANANTE" character varying(100) NOT NULL,
    "APELLIDO_ACOMPANANTE" character varying(100) NOT NULL,
    "FK_TIPO_DOCUMENTO" integer NOT NULL,
    "DOCUMENTO_ACOMPANANTE" character varying(30) NOT NULL,
    "DIRECCION" character varying(255) NOT NULL,
    "FK_TIPO_PARENTESCO" integer NOT NULL,
    "TELEFONO" character varying(50) NOT NULL,
    "FECHA_CREACION" timestamp with time zone NOT NULL,
    "FECHA_ACTUALIZACION" timestamp with time zone NOT NULL
);


--
-- Name: acompanante_ID_ACOMPANANTE_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."acompanante_ID_ACOMPANANTE_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: acompanante_ID_ACOMPANANTE_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."acompanante_ID_ACOMPANANTE_seq" OWNED BY public.acompanante."ID_ACOMPANANTE";


--
-- Name: admision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admision (
    "ID_ADMISION" character varying(50) NOT NULL,
    "FK_FACTURA" character varying(50),
    "FK_PACIENTE" integer NOT NULL,
    "FECHA_ADMISION" character varying(30) NOT NULL,
    "ID_HABITACION" integer,
    "FK_EPS" bigint NOT NULL,
    "OBSERVACIONES" text,
    "FK_TIPO_ESTADO" integer NOT NULL,
    "ID_USUARIO" integer NOT NULL,
    "FECHA_EGRESO" timestamp with time zone,
    "FECHA_CREACION" timestamp with time zone NOT NULL,
    "FECHA_ACTUALIZACION" timestamp with time zone NOT NULL
);


--
-- Name: articulado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulado (
    "ID" integer NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "COD_ARTICULO" integer NOT NULL,
    "PARAGRAFO" character varying(50) NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "DESCRIPCION" text,
    "TIPO_PARAGRAFO" character varying(100) NOT NULL
);


--
-- Name: articulado_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."articulado_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: articulado_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."articulado_ID_seq" OWNED BY public.articulado."ID";


--
-- Name: autorizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.autorizacion (
    "ID" integer NOT NULL,
    "FK_ADMISION" character varying(50) NOT NULL,
    "FK_TIPO_AUTORIZACION" integer NOT NULL,
    "NUMERO_AUTORIZACION" character varying(50) NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "CANTIDAD" integer DEFAULT 1,
    "FK_TARIFARIO" integer NOT NULL,
    "ID_USUARIO" integer NOT NULL,
    "FECHA_CREACION" timestamp with time zone NOT NULL,
    "FECHA_ACTUALIZACION" timestamp with time zone NOT NULL
);


--
-- Name: autorizacion_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."autorizacion_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: autorizacion_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."autorizacion_ID_seq" OWNED BY public.autorizacion."ID";


--
-- Name: cama; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cama (
    "ID_HABITACION" integer NOT NULL,
    "CODIGO_CAMA" character varying(20) NOT NULL,
    "ESTADO_CAMA" integer DEFAULT 0,
    "TIPO_CAMA" character varying(50) NOT NULL
);


--
-- Name: centro_costo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.centro_costo (
    "ID_CENTRO_COSTO" integer NOT NULL,
    "DESCRIPCION_CENTRO_COSTO" character varying(150) NOT NULL,
    "FK_NIVEL_ATENCION" integer NOT NULL,
    "FK_ESPECIALIDAD" integer,
    "TIPO_AMBITO" character varying(50) NOT NULL
);


--
-- Name: centro_costo_ID_CENTRO_COSTO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."centro_costo_ID_CENTRO_COSTO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: centro_costo_ID_CENTRO_COSTO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."centro_costo_ID_CENTRO_COSTO_seq" OWNED BY public.centro_costo."ID_CENTRO_COSTO";


--
-- Name: contrato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contrato (
    "ID_CONTRATO" integer NOT NULL,
    "FK_EPS" bigint NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "TIPO_VARIACION" character varying(20) NOT NULL,
    "PORCENTAJE_AMB" numeric(5,2) DEFAULT 0,
    "PORCENTAJE_URG" numeric(5,2) DEFAULT 0,
    "PORCENTAJE_HOSP" numeric(5,2) DEFAULT 0,
    "CONTRATO" character varying(50) NOT NULL,
    "FECHA_INI_CONTRATO" character varying(30) NOT NULL,
    "FECHA_FIN_CONTRATO" character varying(30) NOT NULL
);


--
-- Name: contrato_ID_CONTRATO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."contrato_ID_CONTRATO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contrato_ID_CONTRATO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."contrato_ID_CONTRATO_seq" OWNED BY public.contrato."ID_CONTRATO";


--
-- Name: convenio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.convenio (
    "ID_EPS" bigint NOT NULL,
    "COD_EPS" character varying(30) NOT NULL,
    "NOMBRE_EPS" character varying(150) NOT NULL,
    "DIRECCION" character varying(255),
    "TELEFONO" character varying(50)
);


--
-- Name: cups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cups (
    "ID_CUPS" integer NOT NULL,
    "CODIGO_MAPIISS" character varying(150),
    "DESCRIPCION_MAPIISS" text,
    "UVR" numeric(10,2) DEFAULT 0,
    "VR_CIRUJANO" bigint DEFAULT 0,
    "VR_ANESTESIOLOGO" bigint DEFAULT 0,
    "VR_AYUDANTE" bigint DEFAULT 0,
    "VR_SALA" bigint DEFAULT 0,
    "VR_MATERIALES" bigint DEFAULT 0,
    "VR_NETO" bigint DEFAULT 0,
    "TIPO_EVENTO" character varying(50),
    "FK_CENTRO_COSTO" integer,
    "FK_TARIFARIO" integer,
    "APLICA_SEXO" character varying(20),
    "DESCRIPCION_EVENTO" character varying(100),
    "AUT_AMB" character varying(50),
    "AUT_HOSP" character varying(50),
    "CANT_MAXIMA" integer DEFAULT 1,
    "FK_NIVEL_ATENCION" integer,
    "FK_TIPO_RIPS" character varying(10)
);


--
-- Name: cups_ID_CUPS_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."cups_ID_CUPS_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cups_ID_CUPS_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."cups_ID_CUPS_seq" OWNED BY public.cups."ID_CUPS";


--
-- Name: departamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departamento (
    "ID_DPTO" character varying(30) NOT NULL,
    "ID" integer NOT NULL,
    "DEPARTAMENTO" character varying(100) NOT NULL,
    "COD_DPTO_RIPS" integer NOT NULL
);


--
-- Name: departamento_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."departamento_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departamento_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."departamento_ID_seq" OWNED BY public.departamento."ID";


--
-- Name: destinatario_notificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.destinatario_notificacion (
    "ID" integer NOT NULL,
    "FK_NOTIFICACION" integer NOT NULL,
    "FK_USUARIO" integer NOT NULL,
    "LEIDO" boolean DEFAULT false,
    "LEIDO_EN" timestamp with time zone
);


--
-- Name: destinatario_notificacion_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."destinatario_notificacion_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: destinatario_notificacion_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."destinatario_notificacion_ID_seq" OWNED BY public.destinatario_notificacion."ID";


--
-- Name: diagnostico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostico (
    "ID_DIAGNOSTICO" integer NOT NULL,
    "CODIGO_DIAGNOSTICO" character varying(20) NOT NULL,
    "DESCRIPCION_DIAGNOSTICO" text NOT NULL,
    "FK_TIPO_ORIGEN" integer NOT NULL,
    "APLICA_SEXO" character varying(20) NOT NULL
);


--
-- Name: diagnostico_ID_DIAGNOSTICO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."diagnostico_ID_DIAGNOSTICO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: diagnostico_ID_DIAGNOSTICO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."diagnostico_ID_DIAGNOSTICO_seq" OWNED BY public.diagnostico."ID_DIAGNOSTICO";


--
-- Name: diagnostico_paciente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostico_paciente (
    "ID_DIAG_PACIENTE" integer NOT NULL,
    "FK_ADMISION" character varying(50) NOT NULL,
    "FK_DIAGNOSTICO" integer NOT NULL
);


--
-- Name: diagnostico_paciente_ID_DIAG_PACIENTE_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."diagnostico_paciente_ID_DIAG_PACIENTE_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: diagnostico_paciente_ID_DIAG_PACIENTE_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."diagnostico_paciente_ID_DIAG_PACIENTE_seq" OWNED BY public.diagnostico_paciente."ID_DIAG_PACIENTE";


--
-- Name: especialidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.especialidad (
    "ID_ESPECIALIDAD" integer NOT NULL,
    "ID_CODIGO_ESPECIALIDAD" character varying(20) NOT NULL,
    "DESCRIPCION_ESPECIALIDAD" character varying(150) NOT NULL
);


--
-- Name: especialidad_ID_ESPECIALIDAD_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."especialidad_ID_ESPECIALIDAD_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: especialidad_ID_ESPECIALIDAD_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."especialidad_ID_ESPECIALIDAD_seq" OWNED BY public.especialidad."ID_ESPECIALIDAD";


--
-- Name: municipio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.municipio (
    "ID" integer NOT NULL,
    "FK_DEPARTAMENTO" character varying(30) NOT NULL,
    "ID_CODIGO_MUNICIPIO" integer NOT NULL,
    "NOMBRE_MUNICIPIO" character varying(150) NOT NULL
);


--
-- Name: municipio_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."municipio_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: municipio_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."municipio_ID_seq" OWNED BY public.municipio."ID";


--
-- Name: nivel_atencion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nivel_atencion (
    "ID_NIVEL_ATENCION" integer NOT NULL,
    "COMPLEJIDAD" character varying(50) NOT NULL,
    "DESCRIPCION" character varying(150) NOT NULL,
    "TIPO_PERSONAL" text NOT NULL
);


--
-- Name: nivel_atencion_ID_NIVEL_ATENCION_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."nivel_atencion_ID_NIVEL_ATENCION_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nivel_atencion_ID_NIVEL_ATENCION_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."nivel_atencion_ID_NIVEL_ATENCION_seq" OWNED BY public.nivel_atencion."ID_NIVEL_ATENCION";


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacion (
    "ID" integer NOT NULL,
    "TIPO" character varying(50) NOT NULL,
    "TITULO" character varying(200) NOT NULL,
    "MENSAJE" text NOT NULL,
    "ID_ACTOR" integer NOT NULL,
    "NOMBRE_ACTOR" character varying(200) NOT NULL,
    "ROL_ACTOR" character varying(20) NOT NULL,
    "URL_ACCION" character varying(500),
    "ETIQUETA_ACCION" character varying(200),
    "FECHA_CREACION" timestamp with time zone NOT NULL
);


--
-- Name: notificacion_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."notificacion_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacion_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."notificacion_ID_seq" OWNED BY public.notificacion."ID";


--
-- Name: opcion_menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opcion_menu (
    "ID" integer NOT NULL,
    "LABEL" character varying(255) NOT NULL,
    "ICONO" character varying(255) NOT NULL,
    "RUTA" character varying(255),
    "ORDEN" integer DEFAULT 0,
    "ID_PADRE" integer,
    "ACTIVO" boolean DEFAULT true
);


--
-- Name: opcion_menu_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."opcion_menu_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opcion_menu_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."opcion_menu_ID_seq" OWNED BY public.opcion_menu."ID";


--
-- Name: paciente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paciente (
    "ID_PACIENTE" integer NOT NULL,
    "FK_TIPO_DOCUMENTO" integer NOT NULL,
    "DOCUMENTO_PACIENTE" character varying(30) NOT NULL,
    "NOMBRE_PACIENTE" character varying(100) NOT NULL,
    "APELLIDO_PACIENTE" character varying(100) NOT NULL,
    "EDAD_PACIENTE" character varying(10) NOT NULL,
    "DIRECCION" character varying(255) NOT NULL,
    "TELEFONO" character varying(50) NOT NULL,
    "CORREO" character varying(100),
    "DISCAPACIDAD" character varying(10) NOT NULL,
    "FK_TIPO_USUARIO" integer NOT NULL,
    "FECHA_NACIMIENTO" character varying(30) NOT NULL,
    "FK_TIPO_GENERO" integer NOT NULL,
    "FK_TIPO_ESTADO" integer NOT NULL,
    "ID_USUARIO" integer NOT NULL,
    "FECHA_CREACION" timestamp with time zone NOT NULL,
    "FECHA_ACTUALIZACION" timestamp with time zone NOT NULL
);


--
-- Name: paciente_ID_PACIENTE_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."paciente_ID_PACIENTE_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paciente_ID_PACIENTE_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."paciente_ID_PACIENTE_seq" OWNED BY public.paciente."ID_PACIENTE";


--
-- Name: paragrafo_aplicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paragrafo_aplicacion (
    "ID_PARAGRAFO_APLICACION" integer NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "FK_DIAGNOSTICO" character varying(20) NOT NULL
);


--
-- Name: paragrafo_aplicacion_ID_PARAGRAFO_APLICACION_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."paragrafo_aplicacion_ID_PARAGRAFO_APLICACION_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paragrafo_aplicacion_ID_PARAGRAFO_APLICACION_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."paragrafo_aplicacion_ID_PARAGRAFO_APLICACION_seq" OWNED BY public.paragrafo_aplicacion."ID_PARAGRAFO_APLICACION";


--
-- Name: paragrafo_edad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paragrafo_edad (
    "ID_PARAGRAFO_EDAD" integer NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "RANGO_DESDE" integer DEFAULT 0,
    "RANGO_HASTA" integer DEFAULT 150
);


--
-- Name: paragrafo_edad_ID_PARAGRAFO_EDAD_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."paragrafo_edad_ID_PARAGRAFO_EDAD_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paragrafo_edad_ID_PARAGRAFO_EDAD_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."paragrafo_edad_ID_PARAGRAFO_EDAD_seq" OWNED BY public.paragrafo_edad."ID_PARAGRAFO_EDAD";


--
-- Name: paragrafo_inclusion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paragrafo_inclusion (
    "ID_PARAGRAFO_INCLUSION" integer NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "CODIGO_SIMPLE" character varying(30) NOT NULL
);


--
-- Name: paragrafo_inclusion_ID_PARAGRAFO_INCLUSION_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."paragrafo_inclusion_ID_PARAGRAFO_INCLUSION_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paragrafo_inclusion_ID_PARAGRAFO_INCLUSION_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."paragrafo_inclusion_ID_PARAGRAFO_INCLUSION_seq" OWNED BY public.paragrafo_inclusion."ID_PARAGRAFO_INCLUSION";


--
-- Name: paragrafo_valor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paragrafo_valor (
    "ID_PARAGRAFO_VALOR" integer NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "COD_ARTICULO" integer NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "PORCENTAJE" numeric(10,2) NOT NULL,
    "TIPO_VARIACION" character varying(50) NOT NULL,
    "TIPO_PARAGRAFO" character varying(100) NOT NULL
);


--
-- Name: paragrafo_valor_ID_PARAGRAFO_VALOR_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."paragrafo_valor_ID_PARAGRAFO_VALOR_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paragrafo_valor_ID_PARAGRAFO_VALOR_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."paragrafo_valor_ID_PARAGRAFO_VALOR_seq" OWNED BY public.paragrafo_valor."ID_PARAGRAFO_VALOR";


--
-- Name: permiso_rol_menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permiso_rol_menu (
    "ID" integer NOT NULL,
    "FK_ROL" integer,
    "FK_OPCION_MENU" integer
);


--
-- Name: permiso_rol_menu_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."permiso_rol_menu_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permiso_rol_menu_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."permiso_rol_menu_ID_seq" OWNED BY public.permiso_rol_menu."ID";


--
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    "ID" integer NOT NULL,
    "NOMBRE" character varying(255) NOT NULL,
    "CODIGO" character varying(20) NOT NULL
);


--
-- Name: rol_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."rol_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rol_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."rol_ID_seq" OWNED BY public.rol."ID";


--
-- Name: sobreescritura_menu_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sobreescritura_menu_usuario (
    "ID" integer NOT NULL,
    "FK_USUARIO" integer,
    "FK_OPCION_MENU" integer,
    "ACCESO" boolean DEFAULT true
);


--
-- Name: sobreescritura_menu_usuario_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."sobreescritura_menu_usuario_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sobreescritura_menu_usuario_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."sobreescritura_menu_usuario_ID_seq" OWNED BY public.sobreescritura_menu_usuario."ID";


--
-- Name: tarifario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarifario (
    "ID_TARIFARIO" integer NOT NULL,
    "NOMBRE_TARIFARIO" character varying(100) NOT NULL
);


--
-- Name: tarifario_ID_TARIFARIO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tarifario_ID_TARIFARIO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tarifario_ID_TARIFARIO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tarifario_ID_TARIFARIO_seq" OWNED BY public.tarifario."ID_TARIFARIO";


--
-- Name: tipo_acceso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_acceso (
    "ID_TIPO_ACCESO" integer NOT NULL,
    "VIA_ACCESO" character varying(100) NOT NULL,
    "FK_TARIFARIO" integer NOT NULL
);


--
-- Name: tipo_acceso_ID_TIPO_ACCESO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_acceso_ID_TIPO_ACCESO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_acceso_ID_TIPO_ACCESO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_acceso_ID_TIPO_ACCESO_seq" OWNED BY public.tipo_acceso."ID_TIPO_ACCESO";


--
-- Name: tipo_autorizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_autorizacion (
    "ID_TIPO_AUTORIZACION" integer NOT NULL,
    "DESCRIPCION_TIPO_AUTORIZACION" character varying(100) NOT NULL,
    "FK_NIVEL_ATENCION" integer NOT NULL
);


--
-- Name: tipo_autorizacion_ID_TIPO_AUTORIZACION_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_autorizacion_ID_TIPO_AUTORIZACION_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_autorizacion_ID_TIPO_AUTORIZACION_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_autorizacion_ID_TIPO_AUTORIZACION_seq" OWNED BY public.tipo_autorizacion."ID_TIPO_AUTORIZACION";


--
-- Name: tipo_documento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_documento (
    "ID_TIPO_DOCUMENTO" integer NOT NULL,
    "CODIGO_TIPO_DOCUMENTO" character varying(10) NOT NULL,
    "DESCRIPCION_TIPO_DOCUMENTO" character varying(150) NOT NULL
);


--
-- Name: tipo_documento_ID_TIPO_DOCUMENTO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_documento_ID_TIPO_DOCUMENTO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_documento_ID_TIPO_DOCUMENTO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_documento_ID_TIPO_DOCUMENTO_seq" OWNED BY public.tipo_documento."ID_TIPO_DOCUMENTO";


--
-- Name: tipo_estado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_estado (
    "ID_TIPO_ESTADO" integer NOT NULL,
    "DESCRIPCION_TIPO_ESTADO" character varying(50) NOT NULL
);


--
-- Name: tipo_estado_ID_TIPO_ESTADO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_estado_ID_TIPO_ESTADO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_estado_ID_TIPO_ESTADO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_estado_ID_TIPO_ESTADO_seq" OWNED BY public.tipo_estado."ID_TIPO_ESTADO";


--
-- Name: tipo_genero; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_genero (
    "ID_TIPO_GENERO" integer NOT NULL,
    "DESCRIPCION_TIPO_GENERO" character varying(50) NOT NULL
);


--
-- Name: tipo_genero_ID_TIPO_GENERO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_genero_ID_TIPO_GENERO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_genero_ID_TIPO_GENERO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_genero_ID_TIPO_GENERO_seq" OWNED BY public.tipo_genero."ID_TIPO_GENERO";


--
-- Name: tipo_origen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_origen (
    "ID_TIPO_ORIGEN" integer NOT NULL,
    "DESCRIPCION_TIPO_ORIGEN" character varying(150) NOT NULL
);


--
-- Name: tipo_origen_ID_TIPO_ORIGEN_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_origen_ID_TIPO_ORIGEN_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_origen_ID_TIPO_ORIGEN_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_origen_ID_TIPO_ORIGEN_seq" OWNED BY public.tipo_origen."ID_TIPO_ORIGEN";


--
-- Name: tipo_paragrafo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_paragrafo (
    "ID_TIPO_PARAGRAFO" integer NOT NULL,
    "FK_TARIFARIO" integer NOT NULL,
    "FK_CODIGO_MAPIISS" character varying(30) NOT NULL,
    "TIPO_PARAGRAFO" character varying(100) NOT NULL
);


--
-- Name: tipo_paragrafo_ID_TIPO_PARAGRAFO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_paragrafo_ID_TIPO_PARAGRAFO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_paragrafo_ID_TIPO_PARAGRAFO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_paragrafo_ID_TIPO_PARAGRAFO_seq" OWNED BY public.tipo_paragrafo."ID_TIPO_PARAGRAFO";


--
-- Name: tipo_parentesco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_parentesco (
    "ID_TIPO_PARENTESCO" integer NOT NULL,
    "DESCRIPCION_PARENTESCO" character varying(100) NOT NULL
);


--
-- Name: tipo_parentesco_ID_TIPO_PARENTESCO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_parentesco_ID_TIPO_PARENTESCO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_parentesco_ID_TIPO_PARENTESCO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_parentesco_ID_TIPO_PARENTESCO_seq" OWNED BY public.tipo_parentesco."ID_TIPO_PARENTESCO";


--
-- Name: tipo_triage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_triage (
    "ID_TIPO_TRIAGE" integer NOT NULL,
    "TIPO_TRIAGE" integer NOT NULL,
    "CLASIFICACION" character varying(100) NOT NULL,
    "TIEMPO_ESPERA" character varying(50) NOT NULL
);


--
-- Name: tipo_triage_ID_TIPO_TRIAGE_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_triage_ID_TIPO_TRIAGE_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_triage_ID_TIPO_TRIAGE_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_triage_ID_TIPO_TRIAGE_seq" OWNED BY public.tipo_triage."ID_TIPO_TRIAGE";


--
-- Name: tipo_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_usuario (
    "ID_TIPO_USUARIO" integer NOT NULL,
    "TIPO_USUARIO" character varying(50) NOT NULL,
    "COPAGO" numeric(10,2) DEFAULT 0,
    "CUOTA_MODERADORA" numeric(10,2) DEFAULT 0,
    "TOPE_EVENTO" numeric(12,2) DEFAULT 0,
    "TOPE_EVENTO_ANUAL" numeric(12,2) DEFAULT 0
);


--
-- Name: tipo_usuario_ID_TIPO_USUARIO_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."tipo_usuario_ID_TIPO_USUARIO_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_usuario_ID_TIPO_USUARIO_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."tipo_usuario_ID_TIPO_USUARIO_seq" OWNED BY public.tipo_usuario."ID_TIPO_USUARIO";


--
-- Name: triage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triage (
    "ID_TRIAGE" integer NOT NULL,
    "FK_TIPO_PRIORIDAD" integer NOT NULL,
    "FK_PACIENTE" integer NOT NULL,
    "FECHA_ATENCION" character varying(30) NOT NULL,
    "FK_COD_EPS" bigint NOT NULL,
    "FK_CODIGO_DIAGNOSTICO" integer NOT NULL,
    "ID_USUARIO" integer NOT NULL,
    "FECHA_CREACION" timestamp with time zone NOT NULL,
    "FECHA_ACTUALIZACION" timestamp with time zone NOT NULL
);


--
-- Name: triage_ID_TRIAGE_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."triage_ID_TRIAGE_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: triage_ID_TRIAGE_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."triage_ID_TRIAGE_seq" OWNED BY public.triage."ID_TRIAGE";


--
-- Name: triage_prioridad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triage_prioridad (
    "ID" integer NOT NULL,
    "FK_TIPO_TRIAGE" integer NOT NULL,
    "TIPO_PRIORIDAD" integer NOT NULL,
    "RANGO_EDAD_DESDE" integer NOT NULL,
    "RANGO_EDAD_HASTA" integer NOT NULL,
    "SEXO" character varying(5) NOT NULL
);


--
-- Name: triage_prioridad_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."triage_prioridad_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: triage_prioridad_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."triage_prioridad_ID_seq" OWNED BY public.triage_prioridad."ID";


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    "ID" integer NOT NULL,
    "NOMBRE" character varying(255) NOT NULL,
    "APELLIDO" character varying(255) NOT NULL,
    "FK_TIPO_DOCUMENTO" integer NOT NULL,
    "DNI" character varying(255) NOT NULL,
    "EMAIL" character varying(255) NOT NULL,
    "CONTRASENA" character varying(255) NOT NULL,
    "TELEFONO" character varying(255),
    "DIRECCION" character varying(255),
    "ACTIVO" boolean DEFAULT true,
    "FK_ROL" integer NOT NULL,
    "FECHA_CREACION" timestamp with time zone NOT NULL,
    "FECHA_ACTUALIZACION" timestamp with time zone NOT NULL
);


--
-- Name: usuario_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."usuario_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."usuario_ID_seq" OWNED BY public.usuario."ID";


--
-- Name: via_acceso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.via_acceso (
    "ID" integer NOT NULL,
    "FK_TIPO_ACCESO" integer NOT NULL,
    "DESCRIPCION_HONORARIO" character varying(100) NOT NULL,
    "PORCENTAJE" numeric(5,2) NOT NULL
);


--
-- Name: via_acceso_ID_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."via_acceso_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: via_acceso_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."via_acceso_ID_seq" OWNED BY public.via_acceso."ID";


--
-- Name: acompanante ID_ACOMPANANTE; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acompanante ALTER COLUMN "ID_ACOMPANANTE" SET DEFAULT nextval('public."acompanante_ID_ACOMPANANTE_seq"'::regclass);


--
-- Name: articulado ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulado ALTER COLUMN "ID" SET DEFAULT nextval('public."articulado_ID_seq"'::regclass);


--
-- Name: autorizacion ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autorizacion ALTER COLUMN "ID" SET DEFAULT nextval('public."autorizacion_ID_seq"'::regclass);


--
-- Name: centro_costo ID_CENTRO_COSTO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centro_costo ALTER COLUMN "ID_CENTRO_COSTO" SET DEFAULT nextval('public."centro_costo_ID_CENTRO_COSTO_seq"'::regclass);


--
-- Name: contrato ID_CONTRATO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrato ALTER COLUMN "ID_CONTRATO" SET DEFAULT nextval('public."contrato_ID_CONTRATO_seq"'::regclass);


--
-- Name: cups ID_CUPS; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cups ALTER COLUMN "ID_CUPS" SET DEFAULT nextval('public."cups_ID_CUPS_seq"'::regclass);


--
-- Name: departamento ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamento ALTER COLUMN "ID" SET DEFAULT nextval('public."departamento_ID_seq"'::regclass);


--
-- Name: destinatario_notificacion ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinatario_notificacion ALTER COLUMN "ID" SET DEFAULT nextval('public."destinatario_notificacion_ID_seq"'::regclass);


--
-- Name: diagnostico ID_DIAGNOSTICO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico ALTER COLUMN "ID_DIAGNOSTICO" SET DEFAULT nextval('public."diagnostico_ID_DIAGNOSTICO_seq"'::regclass);


--
-- Name: diagnostico_paciente ID_DIAG_PACIENTE; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico_paciente ALTER COLUMN "ID_DIAG_PACIENTE" SET DEFAULT nextval('public."diagnostico_paciente_ID_DIAG_PACIENTE_seq"'::regclass);


--
-- Name: especialidad ID_ESPECIALIDAD; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialidad ALTER COLUMN "ID_ESPECIALIDAD" SET DEFAULT nextval('public."especialidad_ID_ESPECIALIDAD_seq"'::regclass);


--
-- Name: municipio ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipio ALTER COLUMN "ID" SET DEFAULT nextval('public."municipio_ID_seq"'::regclass);


--
-- Name: nivel_atencion ID_NIVEL_ATENCION; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nivel_atencion ALTER COLUMN "ID_NIVEL_ATENCION" SET DEFAULT nextval('public."nivel_atencion_ID_NIVEL_ATENCION_seq"'::regclass);


--
-- Name: notificacion ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion ALTER COLUMN "ID" SET DEFAULT nextval('public."notificacion_ID_seq"'::regclass);


--
-- Name: opcion_menu ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opcion_menu ALTER COLUMN "ID" SET DEFAULT nextval('public."opcion_menu_ID_seq"'::regclass);


--
-- Name: paciente ID_PACIENTE; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente ALTER COLUMN "ID_PACIENTE" SET DEFAULT nextval('public."paciente_ID_PACIENTE_seq"'::regclass);


--
-- Name: paragrafo_aplicacion ID_PARAGRAFO_APLICACION; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_aplicacion ALTER COLUMN "ID_PARAGRAFO_APLICACION" SET DEFAULT nextval('public."paragrafo_aplicacion_ID_PARAGRAFO_APLICACION_seq"'::regclass);


--
-- Name: paragrafo_edad ID_PARAGRAFO_EDAD; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_edad ALTER COLUMN "ID_PARAGRAFO_EDAD" SET DEFAULT nextval('public."paragrafo_edad_ID_PARAGRAFO_EDAD_seq"'::regclass);


--
-- Name: paragrafo_inclusion ID_PARAGRAFO_INCLUSION; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_inclusion ALTER COLUMN "ID_PARAGRAFO_INCLUSION" SET DEFAULT nextval('public."paragrafo_inclusion_ID_PARAGRAFO_INCLUSION_seq"'::regclass);


--
-- Name: paragrafo_valor ID_PARAGRAFO_VALOR; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_valor ALTER COLUMN "ID_PARAGRAFO_VALOR" SET DEFAULT nextval('public."paragrafo_valor_ID_PARAGRAFO_VALOR_seq"'::regclass);


--
-- Name: permiso_rol_menu ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permiso_rol_menu ALTER COLUMN "ID" SET DEFAULT nextval('public."permiso_rol_menu_ID_seq"'::regclass);


--
-- Name: rol ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol ALTER COLUMN "ID" SET DEFAULT nextval('public."rol_ID_seq"'::regclass);


--
-- Name: sobreescritura_menu_usuario ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sobreescritura_menu_usuario ALTER COLUMN "ID" SET DEFAULT nextval('public."sobreescritura_menu_usuario_ID_seq"'::regclass);


--
-- Name: tarifario ID_TARIFARIO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifario ALTER COLUMN "ID_TARIFARIO" SET DEFAULT nextval('public."tarifario_ID_TARIFARIO_seq"'::regclass);


--
-- Name: tipo_acceso ID_TIPO_ACCESO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_acceso ALTER COLUMN "ID_TIPO_ACCESO" SET DEFAULT nextval('public."tipo_acceso_ID_TIPO_ACCESO_seq"'::regclass);


--
-- Name: tipo_autorizacion ID_TIPO_AUTORIZACION; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_autorizacion ALTER COLUMN "ID_TIPO_AUTORIZACION" SET DEFAULT nextval('public."tipo_autorizacion_ID_TIPO_AUTORIZACION_seq"'::regclass);


--
-- Name: tipo_documento ID_TIPO_DOCUMENTO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documento ALTER COLUMN "ID_TIPO_DOCUMENTO" SET DEFAULT nextval('public."tipo_documento_ID_TIPO_DOCUMENTO_seq"'::regclass);


--
-- Name: tipo_estado ID_TIPO_ESTADO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_estado ALTER COLUMN "ID_TIPO_ESTADO" SET DEFAULT nextval('public."tipo_estado_ID_TIPO_ESTADO_seq"'::regclass);


--
-- Name: tipo_genero ID_TIPO_GENERO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_genero ALTER COLUMN "ID_TIPO_GENERO" SET DEFAULT nextval('public."tipo_genero_ID_TIPO_GENERO_seq"'::regclass);


--
-- Name: tipo_origen ID_TIPO_ORIGEN; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_origen ALTER COLUMN "ID_TIPO_ORIGEN" SET DEFAULT nextval('public."tipo_origen_ID_TIPO_ORIGEN_seq"'::regclass);


--
-- Name: tipo_paragrafo ID_TIPO_PARAGRAFO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_paragrafo ALTER COLUMN "ID_TIPO_PARAGRAFO" SET DEFAULT nextval('public."tipo_paragrafo_ID_TIPO_PARAGRAFO_seq"'::regclass);


--
-- Name: tipo_parentesco ID_TIPO_PARENTESCO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_parentesco ALTER COLUMN "ID_TIPO_PARENTESCO" SET DEFAULT nextval('public."tipo_parentesco_ID_TIPO_PARENTESCO_seq"'::regclass);


--
-- Name: tipo_triage ID_TIPO_TRIAGE; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_triage ALTER COLUMN "ID_TIPO_TRIAGE" SET DEFAULT nextval('public."tipo_triage_ID_TIPO_TRIAGE_seq"'::regclass);


--
-- Name: tipo_usuario ID_TIPO_USUARIO; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_usuario ALTER COLUMN "ID_TIPO_USUARIO" SET DEFAULT nextval('public."tipo_usuario_ID_TIPO_USUARIO_seq"'::regclass);


--
-- Name: triage ID_TRIAGE; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage ALTER COLUMN "ID_TRIAGE" SET DEFAULT nextval('public."triage_ID_TRIAGE_seq"'::regclass);


--
-- Name: triage_prioridad ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_prioridad ALTER COLUMN "ID" SET DEFAULT nextval('public."triage_prioridad_ID_seq"'::regclass);


--
-- Name: usuario ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario ALTER COLUMN "ID" SET DEFAULT nextval('public."usuario_ID_seq"'::regclass);


--
-- Name: via_acceso ID; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.via_acceso ALTER COLUMN "ID" SET DEFAULT nextval('public."via_acceso_ID_seq"'::regclass);


--
-- Name: acompanante acompanante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acompanante
    ADD CONSTRAINT acompanante_pkey PRIMARY KEY ("ID_ACOMPANANTE");


--
-- Name: admision admision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admision
    ADD CONSTRAINT admision_pkey PRIMARY KEY ("ID_ADMISION");


--
-- Name: articulado articulado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulado
    ADD CONSTRAINT articulado_pkey PRIMARY KEY ("ID");


--
-- Name: autorizacion autorizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autorizacion
    ADD CONSTRAINT autorizacion_pkey PRIMARY KEY ("ID");


--
-- Name: cama cama_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cama
    ADD CONSTRAINT cama_pkey PRIMARY KEY ("ID_HABITACION");


--
-- Name: centro_costo centro_costo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centro_costo
    ADD CONSTRAINT centro_costo_pkey PRIMARY KEY ("ID_CENTRO_COSTO");


--
-- Name: contrato contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrato
    ADD CONSTRAINT contrato_pkey PRIMARY KEY ("ID_CONTRATO");


--
-- Name: convenio convenio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.convenio
    ADD CONSTRAINT convenio_pkey PRIMARY KEY ("ID_EPS");


--
-- Name: cups cups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cups
    ADD CONSTRAINT cups_pkey PRIMARY KEY ("ID_CUPS");


--
-- Name: departamento departamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamento
    ADD CONSTRAINT departamento_pkey PRIMARY KEY ("ID_DPTO");


--
-- Name: destinatario_notificacion destinatario_notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinatario_notificacion
    ADD CONSTRAINT destinatario_notificacion_pkey PRIMARY KEY ("ID");


--
-- Name: diagnostico diagnostico_CODIGO_DIAGNOSTICO_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico
    ADD CONSTRAINT "diagnostico_CODIGO_DIAGNOSTICO_key" UNIQUE ("CODIGO_DIAGNOSTICO");


--
-- Name: diagnostico_paciente diagnostico_paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico_paciente
    ADD CONSTRAINT diagnostico_paciente_pkey PRIMARY KEY ("ID_DIAG_PACIENTE");


--
-- Name: diagnostico diagnostico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico
    ADD CONSTRAINT diagnostico_pkey PRIMARY KEY ("ID_DIAGNOSTICO");


--
-- Name: especialidad especialidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialidad
    ADD CONSTRAINT especialidad_pkey PRIMARY KEY ("ID_ESPECIALIDAD");


--
-- Name: municipio municipio_ID_CODIGO_MUNICIPIO_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipio
    ADD CONSTRAINT "municipio_ID_CODIGO_MUNICIPIO_key" UNIQUE ("ID_CODIGO_MUNICIPIO");


--
-- Name: municipio municipio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipio
    ADD CONSTRAINT municipio_pkey PRIMARY KEY ("ID");


--
-- Name: nivel_atencion nivel_atencion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nivel_atencion
    ADD CONSTRAINT nivel_atencion_pkey PRIMARY KEY ("ID_NIVEL_ATENCION");


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY ("ID");


--
-- Name: opcion_menu opcion_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opcion_menu
    ADD CONSTRAINT opcion_menu_pkey PRIMARY KEY ("ID");


--
-- Name: paciente paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_pkey PRIMARY KEY ("ID_PACIENTE");


--
-- Name: paragrafo_aplicacion paragrafo_aplicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_aplicacion
    ADD CONSTRAINT paragrafo_aplicacion_pkey PRIMARY KEY ("ID_PARAGRAFO_APLICACION");


--
-- Name: paragrafo_edad paragrafo_edad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_edad
    ADD CONSTRAINT paragrafo_edad_pkey PRIMARY KEY ("ID_PARAGRAFO_EDAD");


--
-- Name: paragrafo_inclusion paragrafo_inclusion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_inclusion
    ADD CONSTRAINT paragrafo_inclusion_pkey PRIMARY KEY ("ID_PARAGRAFO_INCLUSION");


--
-- Name: paragrafo_valor paragrafo_valor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_valor
    ADD CONSTRAINT paragrafo_valor_pkey PRIMARY KEY ("ID_PARAGRAFO_VALOR");


--
-- Name: permiso_rol_menu permiso_rol_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permiso_rol_menu
    ADD CONSTRAINT permiso_rol_menu_pkey PRIMARY KEY ("ID");


--
-- Name: rol rol_CODIGO_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT "rol_CODIGO_key" UNIQUE ("CODIGO");


--
-- Name: rol rol_NOMBRE_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT "rol_NOMBRE_key" UNIQUE ("NOMBRE");


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY ("ID");


--
-- Name: sobreescritura_menu_usuario sobreescritura_menu_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sobreescritura_menu_usuario
    ADD CONSTRAINT sobreescritura_menu_usuario_pkey PRIMARY KEY ("ID");


--
-- Name: tarifario tarifario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifario
    ADD CONSTRAINT tarifario_pkey PRIMARY KEY ("ID_TARIFARIO");


--
-- Name: tipo_acceso tipo_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_acceso
    ADD CONSTRAINT tipo_acceso_pkey PRIMARY KEY ("ID_TIPO_ACCESO");


--
-- Name: tipo_autorizacion tipo_autorizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_autorizacion
    ADD CONSTRAINT tipo_autorizacion_pkey PRIMARY KEY ("ID_TIPO_AUTORIZACION");


--
-- Name: tipo_documento tipo_documento_CODIGO_TIPO_DOCUMENTO_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documento
    ADD CONSTRAINT "tipo_documento_CODIGO_TIPO_DOCUMENTO_key" UNIQUE ("CODIGO_TIPO_DOCUMENTO");


--
-- Name: tipo_documento tipo_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documento
    ADD CONSTRAINT tipo_documento_pkey PRIMARY KEY ("ID_TIPO_DOCUMENTO");


--
-- Name: tipo_estado tipo_estado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_estado
    ADD CONSTRAINT tipo_estado_pkey PRIMARY KEY ("ID_TIPO_ESTADO");


--
-- Name: tipo_genero tipo_genero_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_genero
    ADD CONSTRAINT tipo_genero_pkey PRIMARY KEY ("ID_TIPO_GENERO");


--
-- Name: tipo_origen tipo_origen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_origen
    ADD CONSTRAINT tipo_origen_pkey PRIMARY KEY ("ID_TIPO_ORIGEN");


--
-- Name: tipo_paragrafo tipo_paragrafo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_paragrafo
    ADD CONSTRAINT tipo_paragrafo_pkey PRIMARY KEY ("ID_TIPO_PARAGRAFO");


--
-- Name: tipo_parentesco tipo_parentesco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_parentesco
    ADD CONSTRAINT tipo_parentesco_pkey PRIMARY KEY ("ID_TIPO_PARENTESCO");


--
-- Name: tipo_triage tipo_triage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_triage
    ADD CONSTRAINT tipo_triage_pkey PRIMARY KEY ("ID_TIPO_TRIAGE");


--
-- Name: tipo_usuario tipo_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_usuario
    ADD CONSTRAINT tipo_usuario_pkey PRIMARY KEY ("ID_TIPO_USUARIO");


--
-- Name: triage triage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage
    ADD CONSTRAINT triage_pkey PRIMARY KEY ("ID_TRIAGE");


--
-- Name: triage_prioridad triage_prioridad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_prioridad
    ADD CONSTRAINT triage_prioridad_pkey PRIMARY KEY ("ID");


--
-- Name: usuario usuario_DNI_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT "usuario_DNI_key" UNIQUE ("DNI");


--
-- Name: usuario usuario_EMAIL_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT "usuario_EMAIL_key" UNIQUE ("EMAIL");


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY ("ID");


--
-- Name: via_acceso via_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.via_acceso
    ADD CONSTRAINT via_acceso_pkey PRIMARY KEY ("ID");


--
-- Name: acompanante__f_k__a_d_m_i_s_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acompanante__f_k__a_d_m_i_s_i_o_n ON public.acompanante USING btree ("FK_ADMISION");


--
-- Name: acompanante__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acompanante__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o ON public.acompanante USING btree ("FK_TIPO_DOCUMENTO");


--
-- Name: acompanante__f_k__t_i_p_o__p_a_r_e_n_t_e_s_c_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acompanante__f_k__t_i_p_o__p_a_r_e_n_t_e_s_c_o ON public.acompanante USING btree ("FK_TIPO_PARENTESCO");


--
-- Name: admision__f_e_c_h_a__a_d_m_i_s_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__f_e_c_h_a__a_d_m_i_s_i_o_n ON public.admision USING btree ("FECHA_ADMISION");


--
-- Name: admision__f_k__e_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__f_k__e_p_s ON public.admision USING btree ("FK_EPS");


--
-- Name: admision__f_k__f_a_c_t_u_r_a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__f_k__f_a_c_t_u_r_a ON public.admision USING btree ("FK_FACTURA");


--
-- Name: admision__f_k__p_a_c_i_e_n_t_e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__f_k__p_a_c_i_e_n_t_e ON public.admision USING btree ("FK_PACIENTE");


--
-- Name: admision__f_k__p_a_c_i_e_n_t_e__f_e_c_h_a__a_d_m_i_s_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__f_k__p_a_c_i_e_n_t_e__f_e_c_h_a__a_d_m_i_s_i_o_n ON public.admision USING btree ("FK_PACIENTE", "FECHA_ADMISION");


--
-- Name: admision__f_k__t_i_p_o__e_s_t_a_d_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__f_k__t_i_p_o__e_s_t_a_d_o ON public.admision USING btree ("FK_TIPO_ESTADO");


--
-- Name: admision__i_d__h_a_b_i_t_a_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__i_d__h_a_b_i_t_a_c_i_o_n ON public.admision USING btree ("ID_HABITACION");


--
-- Name: admision__i_d__u_s_u_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admision__i_d__u_s_u_a_r_i_o ON public.admision USING btree ("ID_USUARIO");


--
-- Name: articulado__c_o_d__a_r_t_i_c_u_l_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulado__c_o_d__a_r_t_i_c_u_l_o ON public.articulado USING btree ("COD_ARTICULO");


--
-- Name: articulado__f_k__c_o_d_i_g_o__c_u_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulado__f_k__c_o_d_i_g_o__c_u_p_s ON public.articulado USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: articulado__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulado__f_k__t_a_r_i_f_a_r_i_o ON public.articulado USING btree ("FK_TARIFARIO");


--
-- Name: articulado__f_k__t_a_r_i_f_a_r_i_o__c_o_d__a_r_t_i_c_u_l_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulado__f_k__t_a_r_i_f_a_r_i_o__c_o_d__a_r_t_i_c_u_l_o ON public.articulado USING btree ("FK_TARIFARIO", "COD_ARTICULO");


--
-- Name: autorizacion__f_k__a_d_m_i_s_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__f_k__a_d_m_i_s_i_o_n ON public.autorizacion USING btree ("FK_ADMISION");


--
-- Name: autorizacion__f_k__a_d_m_i_s_i_o_n__f_k__c_o_d_i_g_o__m_a_p_i_i; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__f_k__a_d_m_i_s_i_o_n__f_k__c_o_d_i_g_o__m_a_p_i_i ON public.autorizacion USING btree ("FK_ADMISION", "FK_CODIGO_MAPIISS");


--
-- Name: autorizacion__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s ON public.autorizacion USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: autorizacion__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__f_k__t_a_r_i_f_a_r_i_o ON public.autorizacion USING btree ("FK_TARIFARIO");


--
-- Name: autorizacion__f_k__t_i_p_o__a_u_t_o_r_i_z_a_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__f_k__t_i_p_o__a_u_t_o_r_i_z_a_c_i_o_n ON public.autorizacion USING btree ("FK_TIPO_AUTORIZACION");


--
-- Name: autorizacion__i_d__u_s_u_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__i_d__u_s_u_a_r_i_o ON public.autorizacion USING btree ("ID_USUARIO");


--
-- Name: autorizacion__n_u_m_e_r_o__a_u_t_o_r_i_z_a_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX autorizacion__n_u_m_e_r_o__a_u_t_o_r_i_z_a_c_i_o_n ON public.autorizacion USING btree ("NUMERO_AUTORIZACION");


--
-- Name: cama__c_o_d_i_g_o__c_a_m_a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cama__c_o_d_i_g_o__c_a_m_a ON public.cama USING btree ("CODIGO_CAMA");


--
-- Name: cama__e_s_t_a_d_o__c_a_m_a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cama__e_s_t_a_d_o__c_a_m_a ON public.cama USING btree ("ESTADO_CAMA");


--
-- Name: cama__t_i_p_o__c_a_m_a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cama__t_i_p_o__c_a_m_a ON public.cama USING btree ("TIPO_CAMA");


--
-- Name: centro_costo__d_e_s_c_r_i_p_c_i_o_n__c_e_n_t_r_o__c_o_s_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX centro_costo__d_e_s_c_r_i_p_c_i_o_n__c_e_n_t_r_o__c_o_s_t_o ON public.centro_costo USING btree ("DESCRIPCION_CENTRO_COSTO");


--
-- Name: centro_costo__f_k__e_s_p_e_c_i_a_l_i_d_a_d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX centro_costo__f_k__e_s_p_e_c_i_a_l_i_d_a_d ON public.centro_costo USING btree ("FK_ESPECIALIDAD");


--
-- Name: centro_costo__f_k__n_i_v_e_l__a_t_e_n_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX centro_costo__f_k__n_i_v_e_l__a_t_e_n_c_i_o_n ON public.centro_costo USING btree ("FK_NIVEL_ATENCION");


--
-- Name: centro_costo__t_i_p_o__a_m_b_i_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX centro_costo__t_i_p_o__a_m_b_i_t_o ON public.centro_costo USING btree ("TIPO_AMBITO");


--
-- Name: contrato__c_o_n_t_r_a_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contrato__c_o_n_t_r_a_t_o ON public.contrato USING btree ("CONTRATO");


--
-- Name: contrato__f_k__e_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contrato__f_k__e_p_s ON public.contrato USING btree ("FK_EPS");


--
-- Name: contrato__f_k__e_p_s__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contrato__f_k__e_p_s__f_k__t_a_r_i_f_a_r_i_o ON public.contrato USING btree ("FK_EPS", "FK_TARIFARIO");


--
-- Name: contrato__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contrato__f_k__t_a_r_i_f_a_r_i_o ON public.contrato USING btree ("FK_TARIFARIO");


--
-- Name: convenio__c_o_d__e_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX convenio__c_o_d__e_p_s ON public.convenio USING btree ("COD_EPS");


--
-- Name: convenio__n_o_m_b_r_e__e_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX convenio__n_o_m_b_r_e__e_p_s ON public.convenio USING btree ("NOMBRE_EPS");


--
-- Name: cups__c_o_d_i_g_o__m_a_p_i_i_s_s__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cups__c_o_d_i_g_o__m_a_p_i_i_s_s__f_k__t_a_r_i_f_a_r_i_o ON public.cups USING btree ("CODIGO_MAPIISS", "FK_TARIFARIO");


--
-- Name: cups__d_e_s_c_r_i_p_c_i_o_n__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cups__d_e_s_c_r_i_p_c_i_o_n__m_a_p_i_i_s_s ON public.cups USING btree ("DESCRIPCION_MAPIISS");


--
-- Name: cups__f_k__c_e_n_t_r_o__c_o_s_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cups__f_k__c_e_n_t_r_o__c_o_s_t_o ON public.cups USING btree ("FK_CENTRO_COSTO");


--
-- Name: cups__f_k__n_i_v_e_l__a_t_e_n_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cups__f_k__n_i_v_e_l__a_t_e_n_c_i_o_n ON public.cups USING btree ("FK_NIVEL_ATENCION");


--
-- Name: cups__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cups__f_k__t_a_r_i_f_a_r_i_o ON public.cups USING btree ("FK_TARIFARIO");


--
-- Name: cups__f_k__t_i_p_o__r_i_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cups__f_k__t_i_p_o__r_i_p_s ON public.cups USING btree ("FK_TIPO_RIPS");


--
-- Name: departamento__c_o_d__d_p_t_o__r_i_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departamento__c_o_d__d_p_t_o__r_i_p_s ON public.departamento USING btree ("COD_DPTO_RIPS");


--
-- Name: departamento__d_e_p_a_r_t_a_m_e_n_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departamento__d_e_p_a_r_t_a_m_e_n_t_o ON public.departamento USING btree ("DEPARTAMENTO");


--
-- Name: destinatario_notificacion__f_k__n_o_t_i_f_i_c_a_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX destinatario_notificacion__f_k__n_o_t_i_f_i_c_a_c_i_o_n ON public.destinatario_notificacion USING btree ("FK_NOTIFICACION");


--
-- Name: destinatario_notificacion__f_k__n_o_t_i_f_i_c_a_c_i_o_n__f_k__u; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX destinatario_notificacion__f_k__n_o_t_i_f_i_c_a_c_i_o_n__f_k__u ON public.destinatario_notificacion USING btree ("FK_NOTIFICACION", "FK_USUARIO");


--
-- Name: destinatario_notificacion__f_k__u_s_u_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX destinatario_notificacion__f_k__u_s_u_a_r_i_o ON public.destinatario_notificacion USING btree ("FK_USUARIO");


--
-- Name: destinatario_notificacion__f_k__u_s_u_a_r_i_o__l_e_i_d_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX destinatario_notificacion__f_k__u_s_u_a_r_i_o__l_e_i_d_o ON public.destinatario_notificacion USING btree ("FK_USUARIO", "LEIDO");


--
-- Name: diagnostico__d_e_s_c_r_i_p_c_i_o_n__d_i_a_g_n_o_s_t_i_c_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX diagnostico__d_e_s_c_r_i_p_c_i_o_n__d_i_a_g_n_o_s_t_i_c_o ON public.diagnostico USING btree ("DESCRIPCION_DIAGNOSTICO");


--
-- Name: diagnostico__f_k__t_i_p_o__o_r_i_g_e_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX diagnostico__f_k__t_i_p_o__o_r_i_g_e_n ON public.diagnostico USING btree ("FK_TIPO_ORIGEN");


--
-- Name: diagnostico_paciente__f_k__a_d_m_i_s_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX diagnostico_paciente__f_k__a_d_m_i_s_i_o_n ON public.diagnostico_paciente USING btree ("FK_ADMISION");


--
-- Name: diagnostico_paciente__f_k__a_d_m_i_s_i_o_n__f_k__d_i_a_g_n_o_s_; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX diagnostico_paciente__f_k__a_d_m_i_s_i_o_n__f_k__d_i_a_g_n_o_s_ ON public.diagnostico_paciente USING btree ("FK_ADMISION", "FK_DIAGNOSTICO");


--
-- Name: diagnostico_paciente__f_k__d_i_a_g_n_o_s_t_i_c_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX diagnostico_paciente__f_k__d_i_a_g_n_o_s_t_i_c_o ON public.diagnostico_paciente USING btree ("FK_DIAGNOSTICO");


--
-- Name: idx_admision_estado_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admision_estado_fecha ON public.admision USING btree ("FK_TIPO_ESTADO", "FECHA_ADMISION" DESC);


--
-- Name: idx_articulado_fk_mapiiss; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articulado_fk_mapiiss ON public.articulado USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: municipio__f_k__d_e_p_a_r_t_a_m_e_n_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX municipio__f_k__d_e_p_a_r_t_a_m_e_n_t_o ON public.municipio USING btree ("FK_DEPARTAMENTO");


--
-- Name: municipio__f_k__d_e_p_a_r_t_a_m_e_n_t_o__n_o_m_b_r_e__m_u_n_i_c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX municipio__f_k__d_e_p_a_r_t_a_m_e_n_t_o__n_o_m_b_r_e__m_u_n_i_c ON public.municipio USING btree ("FK_DEPARTAMENTO", "NOMBRE_MUNICIPIO");


--
-- Name: municipio__n_o_m_b_r_e__m_u_n_i_c_i_p_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX municipio__n_o_m_b_r_e__m_u_n_i_c_i_p_i_o ON public.municipio USING btree ("NOMBRE_MUNICIPIO");


--
-- Name: notificacion__i_d__a_c_t_o_r; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificacion__i_d__a_c_t_o_r ON public.notificacion USING btree ("ID_ACTOR");


--
-- Name: notificacion__t_i_p_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificacion__t_i_p_o ON public.notificacion USING btree ("TIPO");


--
-- Name: notificacion_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificacion_created_at ON public.notificacion USING btree ("FECHA_CREACION");


--
-- Name: paciente__d_o_c_u_m_e_n_t_o__p_a_c_i_e_n_t_e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paciente__d_o_c_u_m_e_n_t_o__p_a_c_i_e_n_t_e ON public.paciente USING btree ("DOCUMENTO_PACIENTE");


--
-- Name: paciente__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paciente__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o ON public.paciente USING btree ("FK_TIPO_DOCUMENTO");


--
-- Name: paciente__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o__d_o_c_u_m_e_n_t_o__p; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX paciente__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o__d_o_c_u_m_e_n_t_o__p ON public.paciente USING btree ("FK_TIPO_DOCUMENTO", "DOCUMENTO_PACIENTE");


--
-- Name: paciente__f_k__t_i_p_o__e_s_t_a_d_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paciente__f_k__t_i_p_o__e_s_t_a_d_o ON public.paciente USING btree ("FK_TIPO_ESTADO");


--
-- Name: paciente__f_k__t_i_p_o__g_e_n_e_r_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paciente__f_k__t_i_p_o__g_e_n_e_r_o ON public.paciente USING btree ("FK_TIPO_GENERO");


--
-- Name: paciente__f_k__t_i_p_o__u_s_u_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paciente__f_k__t_i_p_o__u_s_u_a_r_i_o ON public.paciente USING btree ("FK_TIPO_USUARIO");


--
-- Name: paciente__i_d__u_s_u_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paciente__i_d__u_s_u_a_r_i_o ON public.paciente USING btree ("ID_USUARIO");


--
-- Name: paragrafo_aplicacion__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_aplicacion__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s ON public.paragrafo_aplicacion USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_aplicacion__f_k__d_i_a_g_n_o_s_t_i_c_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_aplicacion__f_k__d_i_a_g_n_o_s_t_i_c_o ON public.paragrafo_aplicacion USING btree ("FK_DIAGNOSTICO");


--
-- Name: paragrafo_aplicacion__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_aplicacion__f_k__t_a_r_i_f_a_r_i_o ON public.paragrafo_aplicacion USING btree ("FK_TARIFARIO");


--
-- Name: paragrafo_aplicacion__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o_; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_aplicacion__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o_ ON public.paragrafo_aplicacion USING btree ("FK_TARIFARIO", "FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_edad__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_edad__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s ON public.paragrafo_edad USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_edad__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_edad__f_k__t_a_r_i_f_a_r_i_o ON public.paragrafo_edad USING btree ("FK_TARIFARIO");


--
-- Name: paragrafo_edad__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__m_a_p; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_edad__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__m_a_p ON public.paragrafo_edad USING btree ("FK_TARIFARIO", "FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_inclusion__c_o_d_i_g_o__s_i_m_p_l_e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_inclusion__c_o_d_i_g_o__s_i_m_p_l_e ON public.paragrafo_inclusion USING btree ("CODIGO_SIMPLE");


--
-- Name: paragrafo_inclusion__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_inclusion__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s ON public.paragrafo_inclusion USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_inclusion__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_inclusion__f_k__t_a_r_i_f_a_r_i_o ON public.paragrafo_inclusion USING btree ("FK_TARIFARIO");


--
-- Name: paragrafo_inclusion__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_inclusion__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__ ON public.paragrafo_inclusion USING btree ("FK_TARIFARIO", "FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_valor__c_o_d__a_r_t_i_c_u_l_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_valor__c_o_d__a_r_t_i_c_u_l_o ON public.paragrafo_valor USING btree ("COD_ARTICULO");


--
-- Name: paragrafo_valor__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_valor__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s ON public.paragrafo_valor USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: paragrafo_valor__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_valor__f_k__t_a_r_i_f_a_r_i_o ON public.paragrafo_valor USING btree ("FK_TARIFARIO");


--
-- Name: paragrafo_valor__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__m_a_; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paragrafo_valor__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__m_a_ ON public.paragrafo_valor USING btree ("FK_TARIFARIO", "FK_CODIGO_MAPIISS");


--
-- Name: permiso_rol_menu__f_k__r_o_l__f_k__o_p_c_i_o_n__m_e_n_u; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permiso_rol_menu__f_k__r_o_l__f_k__o_p_c_i_o_n__m_e_n_u ON public.permiso_rol_menu USING btree ("FK_ROL", "FK_OPCION_MENU");


--
-- Name: sobreescritura_menu_usuario__f_k__u_s_u_a_r_i_o__f_k__o_p_c_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sobreescritura_menu_usuario__f_k__u_s_u_a_r_i_o__f_k__o_p_c_i_o ON public.sobreescritura_menu_usuario USING btree ("FK_USUARIO", "FK_OPCION_MENU");


--
-- Name: tipo_acceso__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tipo_acceso__f_k__t_a_r_i_f_a_r_i_o ON public.tipo_acceso USING btree ("FK_TARIFARIO");


--
-- Name: tipo_acceso__v_i_a__a_c_c_e_s_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tipo_acceso__v_i_a__a_c_c_e_s_o ON public.tipo_acceso USING btree ("VIA_ACCESO");


--
-- Name: tipo_paragrafo__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tipo_paragrafo__f_k__c_o_d_i_g_o__m_a_p_i_i_s_s ON public.tipo_paragrafo USING btree ("FK_CODIGO_MAPIISS");


--
-- Name: tipo_paragrafo__f_k__t_a_r_i_f_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tipo_paragrafo__f_k__t_a_r_i_f_a_r_i_o ON public.tipo_paragrafo USING btree ("FK_TARIFARIO");


--
-- Name: tipo_paragrafo__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__m_a_p; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tipo_paragrafo__f_k__t_a_r_i_f_a_r_i_o__f_k__c_o_d_i_g_o__m_a_p ON public.tipo_paragrafo USING btree ("FK_TARIFARIO", "FK_CODIGO_MAPIISS");


--
-- Name: tipo_paragrafo__t_i_p_o__p_a_r_a_g_r_a_f_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tipo_paragrafo__t_i_p_o__p_a_r_a_g_r_a_f_o ON public.tipo_paragrafo USING btree ("TIPO_PARAGRAFO");


--
-- Name: triage__f_e_c_h_a__a_t_e_n_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__f_e_c_h_a__a_t_e_n_c_i_o_n ON public.triage USING btree ("FECHA_ATENCION");


--
-- Name: triage__f_k__c_o_d__e_p_s; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__f_k__c_o_d__e_p_s ON public.triage USING btree ("FK_COD_EPS");


--
-- Name: triage__f_k__c_o_d_i_g_o__d_i_a_g_n_o_s_t_i_c_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__f_k__c_o_d_i_g_o__d_i_a_g_n_o_s_t_i_c_o ON public.triage USING btree ("FK_CODIGO_DIAGNOSTICO");


--
-- Name: triage__f_k__p_a_c_i_e_n_t_e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__f_k__p_a_c_i_e_n_t_e ON public.triage USING btree ("FK_PACIENTE");


--
-- Name: triage__f_k__p_a_c_i_e_n_t_e__f_e_c_h_a__a_t_e_n_c_i_o_n; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__f_k__p_a_c_i_e_n_t_e__f_e_c_h_a__a_t_e_n_c_i_o_n ON public.triage USING btree ("FK_PACIENTE", "FECHA_ATENCION");


--
-- Name: triage__f_k__t_i_p_o__p_r_i_o_r_i_d_a_d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__f_k__t_i_p_o__p_r_i_o_r_i_d_a_d ON public.triage USING btree ("FK_TIPO_PRIORIDAD");


--
-- Name: triage__i_d__u_s_u_a_r_i_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage__i_d__u_s_u_a_r_i_o ON public.triage USING btree ("ID_USUARIO");


--
-- Name: triage_prioridad__f_k__t_i_p_o__t_r_i_a_g_e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage_prioridad__f_k__t_i_p_o__t_r_i_a_g_e ON public.triage_prioridad USING btree ("FK_TIPO_TRIAGE");


--
-- Name: triage_prioridad__t_i_p_o__p_r_i_o_r_i_d_a_d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage_prioridad__t_i_p_o__p_r_i_o_r_i_d_a_d ON public.triage_prioridad USING btree ("TIPO_PRIORIDAD");


--
-- Name: uq_autorizacion_adm_tipo_cups_tarifario; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_autorizacion_adm_tipo_cups_tarifario ON public.autorizacion USING btree ("FK_ADMISION", "FK_TIPO_AUTORIZACION", "FK_CODIGO_MAPIISS", "FK_TARIFARIO");


--
-- Name: usuario__f_k__r_o_l; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuario__f_k__r_o_l ON public.usuario USING btree ("FK_ROL");


--
-- Name: usuario__f_k__r_o_l__a_c_t_i_v_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuario__f_k__r_o_l__a_c_t_i_v_o ON public.usuario USING btree ("FK_ROL", "ACTIVO");


--
-- Name: usuario__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuario__f_k__t_i_p_o__d_o_c_u_m_e_n_t_o ON public.usuario USING btree ("FK_TIPO_DOCUMENTO");


--
-- Name: via_acceso__f_k__t_i_p_o__a_c_c_e_s_o; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX via_acceso__f_k__t_i_p_o__a_c_c_e_s_o ON public.via_acceso USING btree ("FK_TIPO_ACCESO");


--
-- Name: acompanante fk_acompanante_fk_admision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acompanante
    ADD CONSTRAINT fk_acompanante_fk_admision FOREIGN KEY ("FK_ADMISION") REFERENCES public.admision("ID_ADMISION");


--
-- Name: acompanante fk_acompanante_fk_tipo_documento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acompanante
    ADD CONSTRAINT fk_acompanante_fk_tipo_documento FOREIGN KEY ("FK_TIPO_DOCUMENTO") REFERENCES public.tipo_documento("ID_TIPO_DOCUMENTO");


--
-- Name: acompanante fk_acompanante_fk_tipo_parentesco; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acompanante
    ADD CONSTRAINT fk_acompanante_fk_tipo_parentesco FOREIGN KEY ("FK_TIPO_PARENTESCO") REFERENCES public.tipo_parentesco("ID_TIPO_PARENTESCO");


--
-- Name: admision fk_admision_fk_eps; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admision
    ADD CONSTRAINT fk_admision_fk_eps FOREIGN KEY ("FK_EPS") REFERENCES public.convenio("ID_EPS");


--
-- Name: admision fk_admision_fk_paciente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admision
    ADD CONSTRAINT fk_admision_fk_paciente FOREIGN KEY ("FK_PACIENTE") REFERENCES public.paciente("ID_PACIENTE");


--
-- Name: admision fk_admision_fk_tipo_estado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admision
    ADD CONSTRAINT fk_admision_fk_tipo_estado FOREIGN KEY ("FK_TIPO_ESTADO") REFERENCES public.tipo_estado("ID_TIPO_ESTADO");


--
-- Name: articulado fk_articulado_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulado
    ADD CONSTRAINT fk_articulado_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: autorizacion fk_autorizacion_fk_admision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autorizacion
    ADD CONSTRAINT fk_autorizacion_fk_admision FOREIGN KEY ("FK_ADMISION") REFERENCES public.admision("ID_ADMISION");


--
-- Name: autorizacion fk_autorizacion_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autorizacion
    ADD CONSTRAINT fk_autorizacion_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: autorizacion fk_autorizacion_fk_tipo_autorizacion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autorizacion
    ADD CONSTRAINT fk_autorizacion_fk_tipo_autorizacion FOREIGN KEY ("FK_TIPO_AUTORIZACION") REFERENCES public.tipo_autorizacion("ID_TIPO_AUTORIZACION");


--
-- Name: centro_costo fk_centro_costo_fk_especialidad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centro_costo
    ADD CONSTRAINT fk_centro_costo_fk_especialidad FOREIGN KEY ("FK_ESPECIALIDAD") REFERENCES public.especialidad("ID_ESPECIALIDAD");


--
-- Name: centro_costo fk_centro_costo_fk_nivel_atencion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centro_costo
    ADD CONSTRAINT fk_centro_costo_fk_nivel_atencion FOREIGN KEY ("FK_NIVEL_ATENCION") REFERENCES public.nivel_atencion("ID_NIVEL_ATENCION");


--
-- Name: contrato fk_contrato_fk_eps; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrato
    ADD CONSTRAINT fk_contrato_fk_eps FOREIGN KEY ("FK_EPS") REFERENCES public.convenio("ID_EPS");


--
-- Name: contrato fk_contrato_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrato
    ADD CONSTRAINT fk_contrato_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: cups fk_cups_fk_centro_costo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cups
    ADD CONSTRAINT fk_cups_fk_centro_costo FOREIGN KEY ("FK_CENTRO_COSTO") REFERENCES public.centro_costo("ID_CENTRO_COSTO");


--
-- Name: cups fk_cups_fk_nivel_atencion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cups
    ADD CONSTRAINT fk_cups_fk_nivel_atencion FOREIGN KEY ("FK_NIVEL_ATENCION") REFERENCES public.nivel_atencion("ID_NIVEL_ATENCION");


--
-- Name: cups fk_cups_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cups
    ADD CONSTRAINT fk_cups_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: destinatario_notificacion fk_destinatario_notificacion_fk_notificacion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinatario_notificacion
    ADD CONSTRAINT fk_destinatario_notificacion_fk_notificacion FOREIGN KEY ("FK_NOTIFICACION") REFERENCES public.notificacion("ID");


--
-- Name: destinatario_notificacion fk_destinatario_notificacion_fk_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinatario_notificacion
    ADD CONSTRAINT fk_destinatario_notificacion_fk_usuario FOREIGN KEY ("FK_USUARIO") REFERENCES public.usuario("ID");


--
-- Name: diagnostico fk_diagnostico_fk_tipo_origen; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico
    ADD CONSTRAINT fk_diagnostico_fk_tipo_origen FOREIGN KEY ("FK_TIPO_ORIGEN") REFERENCES public.tipo_origen("ID_TIPO_ORIGEN");


--
-- Name: diagnostico_paciente fk_diagnostico_paciente_fk_admision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico_paciente
    ADD CONSTRAINT fk_diagnostico_paciente_fk_admision FOREIGN KEY ("FK_ADMISION") REFERENCES public.admision("ID_ADMISION");


--
-- Name: diagnostico_paciente fk_diagnostico_paciente_fk_diagnostico; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico_paciente
    ADD CONSTRAINT fk_diagnostico_paciente_fk_diagnostico FOREIGN KEY ("FK_DIAGNOSTICO") REFERENCES public.diagnostico("ID_DIAGNOSTICO");


--
-- Name: municipio fk_municipio_fk_departamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipio
    ADD CONSTRAINT fk_municipio_fk_departamento FOREIGN KEY ("FK_DEPARTAMENTO") REFERENCES public.departamento("ID_DPTO");


--
-- Name: paciente fk_paciente_fk_tipo_documento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT fk_paciente_fk_tipo_documento FOREIGN KEY ("FK_TIPO_DOCUMENTO") REFERENCES public.tipo_documento("ID_TIPO_DOCUMENTO");


--
-- Name: paciente fk_paciente_fk_tipo_estado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT fk_paciente_fk_tipo_estado FOREIGN KEY ("FK_TIPO_ESTADO") REFERENCES public.tipo_estado("ID_TIPO_ESTADO");


--
-- Name: paciente fk_paciente_fk_tipo_genero; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT fk_paciente_fk_tipo_genero FOREIGN KEY ("FK_TIPO_GENERO") REFERENCES public.tipo_genero("ID_TIPO_GENERO");


--
-- Name: paciente fk_paciente_fk_tipo_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT fk_paciente_fk_tipo_usuario FOREIGN KEY ("FK_TIPO_USUARIO") REFERENCES public.tipo_usuario("ID_TIPO_USUARIO");


--
-- Name: paragrafo_aplicacion fk_paragrafo_aplicacion_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_aplicacion
    ADD CONSTRAINT fk_paragrafo_aplicacion_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: paragrafo_edad fk_paragrafo_edad_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_edad
    ADD CONSTRAINT fk_paragrafo_edad_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: paragrafo_inclusion fk_paragrafo_inclusion_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_inclusion
    ADD CONSTRAINT fk_paragrafo_inclusion_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: paragrafo_valor fk_paragrafo_valor_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paragrafo_valor
    ADD CONSTRAINT fk_paragrafo_valor_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: permiso_rol_menu fk_permiso_rol_menu_fk_opcion_menu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permiso_rol_menu
    ADD CONSTRAINT fk_permiso_rol_menu_fk_opcion_menu FOREIGN KEY ("FK_OPCION_MENU") REFERENCES public.opcion_menu("ID");


--
-- Name: permiso_rol_menu fk_permiso_rol_menu_fk_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permiso_rol_menu
    ADD CONSTRAINT fk_permiso_rol_menu_fk_rol FOREIGN KEY ("FK_ROL") REFERENCES public.rol("ID");


--
-- Name: sobreescritura_menu_usuario fk_sobreescritura_menu_usuario_fk_opcion_menu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sobreescritura_menu_usuario
    ADD CONSTRAINT fk_sobreescritura_menu_usuario_fk_opcion_menu FOREIGN KEY ("FK_OPCION_MENU") REFERENCES public.opcion_menu("ID");


--
-- Name: sobreescritura_menu_usuario fk_sobreescritura_menu_usuario_fk_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sobreescritura_menu_usuario
    ADD CONSTRAINT fk_sobreescritura_menu_usuario_fk_usuario FOREIGN KEY ("FK_USUARIO") REFERENCES public.usuario("ID");


--
-- Name: tipo_acceso fk_tipo_acceso_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_acceso
    ADD CONSTRAINT fk_tipo_acceso_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: tipo_paragrafo fk_tipo_paragrafo_fk_tarifario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_paragrafo
    ADD CONSTRAINT fk_tipo_paragrafo_fk_tarifario FOREIGN KEY ("FK_TARIFARIO") REFERENCES public.tarifario("ID_TARIFARIO");


--
-- Name: triage fk_triage_fk_cod_eps; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage
    ADD CONSTRAINT fk_triage_fk_cod_eps FOREIGN KEY ("FK_COD_EPS") REFERENCES public.convenio("ID_EPS");


--
-- Name: triage fk_triage_fk_codigo_diagnostico; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage
    ADD CONSTRAINT fk_triage_fk_codigo_diagnostico FOREIGN KEY ("FK_CODIGO_DIAGNOSTICO") REFERENCES public.diagnostico("ID_DIAGNOSTICO");


--
-- Name: triage fk_triage_fk_paciente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage
    ADD CONSTRAINT fk_triage_fk_paciente FOREIGN KEY ("FK_PACIENTE") REFERENCES public.paciente("ID_PACIENTE");


--
-- Name: triage fk_triage_fk_tipo_prioridad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage
    ADD CONSTRAINT fk_triage_fk_tipo_prioridad FOREIGN KEY ("FK_TIPO_PRIORIDAD") REFERENCES public.triage_prioridad("ID");


--
-- Name: triage_prioridad fk_triage_prioridad_fk_tipo_triage; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_prioridad
    ADD CONSTRAINT fk_triage_prioridad_fk_tipo_triage FOREIGN KEY ("FK_TIPO_TRIAGE") REFERENCES public.tipo_triage("ID_TIPO_TRIAGE");


--
-- Name: usuario fk_usuario_fk_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk_usuario_fk_rol FOREIGN KEY ("FK_ROL") REFERENCES public.rol("ID");


--
-- Name: usuario fk_usuario_fk_tipo_documento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk_usuario_fk_tipo_documento FOREIGN KEY ("FK_TIPO_DOCUMENTO") REFERENCES public.tipo_documento("ID_TIPO_DOCUMENTO");


--
-- Name: via_acceso fk_via_acceso_fk_tipo_acceso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.via_acceso
    ADD CONSTRAINT fk_via_acceso_fk_tipo_acceso FOREIGN KEY ("FK_TIPO_ACCESO") REFERENCES public.tipo_acceso("ID_TIPO_ACCESO");


--
-- PostgreSQL database dump complete
--

\unrestrict Mx8cefFOvC2DppiVD7P0Db08nCoS2rVr5gdleqOXEZneugY00uqftTtIRNkmKUv

