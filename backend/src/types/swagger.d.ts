declare module 'swagger-jsdoc' {
  const swaggerJsdoc: any;
  export default swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  const swaggerUi: {
    serve: any;
    setup: (spec: any, options?: any) => any;
  };
  export default swaggerUi;
}