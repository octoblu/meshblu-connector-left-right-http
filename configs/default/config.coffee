module.exports =
  title: "Default Configuration"
  type: "object"
  properties:
    leftRightOptions:
      title: "Options"
      type: "object"
      properties:
        buttonUrl:
          title: 'Button Url'
          type: 'string'
          default: 'ws://localhost:52052'
        commands:
          type: 'object'
          additionalProperties:
            type: 'string'
          default:
            endSkype: "env DISPLAY=:0 wmctrl -ia \"$(env DISPLAY=:0 wmctrl -l | grep 'Managed Win10 LAS Desktop' | awk '{print $1}')\""
            startSkype: "env DISPLAY=:0 xdotool windowminimize \"$(env DISPLAY=:0 wmctrl -l | grep 'Managed Win10 LAS Desktop' | awk '{print $1}')\""
        rotatorUrls:
          type: 'object'
          additionalProperties:
            type: 'string'
          default:
            rotateLeft: 'http://localhost:5050/previous'
            rotateRight: 'http://localhost:5050/next'
