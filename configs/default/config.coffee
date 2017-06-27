module.exports =
  title: "Default Configuration"
  type: "object"
  properties:
    options:
      title: "Options"
      type: "object"
      properties:
        buttonUrl:
          title: 'Button Url'
          type: 'string'
        commands:
          type: 'object'
          additionalProperties:
            type: 'string'
          default: {}
        rotatorUrls:
          type: 'object'
          additionalProperties:
            type: 'string'
          default: {}
