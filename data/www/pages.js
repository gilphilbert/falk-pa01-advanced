function getContent(fragmentId, callback) {
  const cr = crel.proxy
  crel.attrMap['on'] = (element, value) => {
    for (const eventName in value) {
      element.addEventListener(eventName, value[eventName])
    }
  }
  var pages = {
    main: cr.div (
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Volume'),
          cr.div({ class: 'row box' },
            cr.div({ class: 'col-xs nogrow' },
              getSVG('volume')
            ),
            cr.div({ class: 'col-xs' },
              cr.div({ class: 'volume-container' },
                cr.input({ type: 'range', min: '1', max: sysStatus.volume.max, value: sysStatus.volume.current, class: 'volume', id: 'volume', on: { change: (e) => { volumeChange(e) } } })
              )
            )
          )
        ),
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Input'),
          cr.div({ class: 'row center-content', id: 'input-container' },
            sysStatus.inputs.map(e => {
              if (e.enabled == true) {
                return cr.div({ class: 'col-xs-4 col-md-3' },
                  cr.div({ class: 'pointer input-box' + ((e.selected) ? ' selected' : ''), 'data-id': e.id, on: { click: function() { inputChange(this) } } },
                    getSVG(e.icon, 'inline-block'),
                    cr.span(e.name),
                    cr.input({ type: 'radio' })
                  )
                )
              } else {
                return false
              }
            })
          )
        )
      ),
    ),
    inputs: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li({ class: 'selected'}, cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li(cr.a({ href: '#system' }, 'System')),
              cr.li(cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li(cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('Select an input to edit'),
            cr.table(
              sysStatus.inputs.map(v => {
                return cr.tr({ class: ((v.enabled) ? '' : 'disabled'), 'data-id': v.id, 'data-name': v.name, 'data-icon': v.icon, 'data-enabled': v.enabled },
                  cr.td({ class: "shrink" },
                    getSVG(v.icon)
                  ),
                  cr.td({ class: "expand" },
                    v.name
                  ),
                  cr.td({ class: "shrink" },
                    cr.span({ class: 'pointer', on: { click: (e) => { showModalInput(e); } } }, getSVG('settings'))
                  )
                )
              })
            )
          )
        )
      )
    ),
    /*
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.a({ href: '#system' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('System'),
                cr.p('Change systems settings that affect sound and display')
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.a({ href: '#wifi' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Wireless'),
                cr.p('Connect this device to your Wifi')
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.a({ href: '#firmware' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Firmware'),
                cr.p('Manage this device\'s firmware')
              )
            )
          )
        )
      )
    ),*/
    system: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li(cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li({ class: 'selected'}, cr.a({ href: '#system' }, 'System')),
              cr.li(cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li(cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Dim screen'),
                cr.p('Screen too bright? Dim automatically after 10s')
              ),
              cr.div({ class: 'col-xs nogrow' },
                cr.label({ class: 'check-container check-menu' },
                  cr.input({ type: 'checkbox', id: 'settings-dim', checked: 'checked', on: { change: (e) => { setDim(e) } } }),
                  cr.span({ class: 'checkmark' })
                )
              )
            )
          )
        ),
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Use Absolute Volume'),
                cr.p('Use absolute volume instead of percentage')
              ),
              cr.div({ class: 'col-xs nogrow' },
                cr.label({ class: 'check-container check-menu' },
                  cr.input({ type: 'checkbox', id: 'settings-absolute-vol', checked: 'checked', on: { change: (e) => { setAbsoluteVolume(e) } } }),
                  cr.span({ class: 'checkmark' })
                )
              )
            )
          )
        ),
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Maximum volume'),
                cr.p('Protect your equipment (and your ears) by limiting volume')
              ),
              cr.div({ class: 'col-xs nogrow' },
                cr.span({ class: 'button-round'}, getSVG('chevron-right'))
              )
            )
          )
        ),
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Startup volume'),
                  cr.p('Keep making yourself jump? Set a maximum startup volume')
                ),
                cr.div({ class: 'col-xs nogrow' },
                  //cr.div({ class: 'addon' },
                  //  cr.button(getSVG('minus')),
                  //  cr.input({ type: 'text', id: 'max-start-volume' }),
                  //  cr.button(getSVG('plus'))
                  //)
                  cr.span({ class: 'button-round'}, getSVG('chevron-right'))
                )
              )
          )
        )
      )
    ),
    wireless: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li(cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li(cr.a({ href: '#system' }, 'System')),
              cr.li({ class: 'selected'}, cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li(cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('Select a WiFi network'),
            cr.div({ id: 'network-list' },
              cr.p('Scanning...', getSVG('rotate-cw', 'spinner')),
            )
          )
        )
      )
    ),
    firmware: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li(cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li(cr.a({ href: '#system' }, 'System')),
              cr.li(cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li({ class: 'selected'}, cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('View and update firmware'),
            cr.h3('Current firmware'),
            cr.p({ class: 'subtitle' }, sysStatus.firmware.fw)
          )
        ),
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Firmware update'),
                  cr.label({ for: 'update-file', class: 'pointer' },
                    cr.span({ class: 'button-round'}, getSVG('upload')),
                    cr.input({ type: 'file', id: 'update-file', class: 'hidden', on: { change: (e) => { uploadOTA(e) } } }),
                  ),
                  cr.div({ class: 'hidden', id: 'progress-container' },
                    cr.div({ class: 'row' },
                      cr.div({ class: 'col-xs nogrow'},
                        cr.p('Updating'),
                        cr.p({ id: 'update-type' }),
                      ),
                      cr.div({ class: 'col-xs'},
                        cr.p('Uploading (', cr.span({ id: 'update-percentage' }), '%)'),
                        cr.progress({ id: 'update-progress', max: 100, min: 0, value: 0 }),
                      ),
                      cr.div({ class: 'col-xs nogrow'},
                        //image here
                      )
                    )
                  ),
                  cr.div({ class: 'hidden', id: 'success-container' },
                    cr.div({ class: 'row' },
                      cr.div({ class: 'col-xs nogrow'},
                        getSVG('check-circle')
                      ),
                      cr.div({ class: 'col-xs'},
                        cr.p('Firmware updated sucessfully'),
                        cr.p({ class: 'block pointer', on: { click: () => { window.location.reload() } } }, 'Click here to reload the web UI')
                      )
                    )
                  ),
                  cr.div({ class: 'hidden', id: 'error-container' },
                    cr.div({ class: 'row' },
                      cr.div({ class: 'col-xs nogrow'},
                        getSVG('frown')
                      ),
                      cr.div({ class: 'col-xs'},
                        cr.p({ id: 'error-message'})
                      )
                    )
                  )
                )
              )
            
          )
        )
      )
    )
  }

  callback(pages[fragmentId])
}
