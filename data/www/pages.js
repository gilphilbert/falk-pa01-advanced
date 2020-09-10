function getContent(fragmentId, callback) {
  const cr = crel.proxy
  crel.attrMap['on'] = (element, value) => {
    for (const eventName in value) {
      element.addEventListener(eventName, value[eventName])
    }
  }
  var pages = {
    main: cr.div({ class: 'menu' },
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.h2('Volume'),
            cr.div({ class: 'row' },
              cr.div({ class: 'col-xs nogrow' },
                getSVG('volume')
              ),
              cr.div({ class: 'col-xs' },
                cr.div({ class: 'volume-container' },
                  cr.input({ type: 'range', min: '1', max: '100', value: '20', class: 'volume', id: 'volume', on: { change: (e) => { volumeChange(e) } } })
                )
              )
            )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
            cr.h2('Input'),
            cr.div({ class: 'row middle-xs center-xs', id: 'input-container' })
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.h2('Settings'),
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.a({ href: '#settings' },
                  cr.span({ class: 'button-round'}, getSVG('settings'))
                )
              )
            )
        )
      ),
    ),
    settings: cr.div({ class: 'menu' },
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.a({ href: '#inputs' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Inputs'),
                cr.p('Name your inputs and turn them on or off!')
              ),
              cr.div({ class: 'col-xs nogrow' },
                cr.span({ class: 'button-round'}, getSVG('chevron-right'))
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          //cr.div({ class: 'box' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Dim screen'),
                cr.p('Screen too bright? Dim automatically after 10s')
              ),
              cr.div({ class: 'col-xs nogrow' },
                cr.label({ class: 'switch pure-flex-middle-xs' },
                  cr.input({ type: 'checkbox', id: 'dim-screen' }),
                  cr.span({ class: 'slider round' })
                )
              )
            )
          //)
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
              //cr.div({ class: 'addon' },
              //  cr.button(getSVG('minus')),
              //  cr.input({ type: 'text', id: 'max-volume' }),
              //  cr.button(getSVG('plus'))
              //)
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
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.a({ href: '#wifi' },
            //cr.div({ class: 'box' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Wireless'),
                  cr.p('Connect this device to your Wifi')
                ),
                cr.div({ class: 'col-xs nogrow' },
                  cr.span({ class: 'button-round'}, getSVG('chevron-right'))
                )
              )
            //)
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.a({ href: '#firmware' },
            cr.div({ class: 'box' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Firmware'),
                  cr.p('Manage this device\'s firmware')
                ),
                cr.div({ class: 'col-xs nogrow' },
                  cr.span({ class: 'button-round'}, getSVG('chevron-right'))
                )
              )
            )
          )
        )
      )
    ),
    inputs: cr.div({ class: 'menu' },
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Inputs'),
          cr.div({ id: 'input-list' })
        )
      )
    ),
    wifi: cr.div({ class: 'menu' },
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
            cr.h2('Select a WiFi network:'),
            cr.div({ id: 'network-list' },
              cr.p('Scanning...'),
              getSVG('rotate-cw', 'spinner')
            )
          )
        )
      )
    ),
    firmware: cr.div({ class: 'menu' },
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
            cr.h2('Firmware version'),
            cr.p('Firmware: ', cr.span({ id: 'firmware-version' })),
            cr.p('Application: ', cr.span({ id: 'application-version' }))
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
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
