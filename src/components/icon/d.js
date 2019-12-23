const ok = 'M351.81165742 729.48242963L134.32922778 512 61.83508498 584.49414281 351.81165742 874.47071645 973.19002778 253.09234608 900.69588498 180.59820206Z'
const close = 'M951.90520135 160.07583979L863.92416021 72.09479865 512 424.01896032 160.07583979 72.09479865 72.09479865 160.07583979 424.01896032 512 72.09479865 863.92416021 160.07583979 951.90520135 512 599.98103968 863.92416021 951.90520135 951.90520135 863.92416021 599.98103968 512Z'
const clear = 'M442.333867 521.3184L310.6816 652.970667a55.842133 55.842133 0 0 0 78.984533 78.984533l131.652267-131.652267 131.652267 131.652267a55.842133 55.842133 0 1 0 78.984533-78.984533l-131.652267-131.652267 131.652267-131.652267a55.842133 55.842133 0 1 0-78.984533-78.984533l-131.652267 131.652267-131.652267-131.652267a55.842133 55.842133 0 1 0-78.984533 78.984533l131.652267 131.652267zM512 1024C229.239467 1024 0 794.760533 0 512 0 229.239467 229.239467 0 512 0c282.760533 0 512 229.239467 512 512 0 282.760533-229.239467 512-512 512z'
const search = 'M1021.184 925.696l-91.904 91.584-202.752-201.92c-75.904 56.64-169.216 91.392-271.424 91.392C203.712 906.688 0 703.744 0 453.376 0 202.944 203.712 0 455.168 0c251.328 0 455.04 202.944 455.04 453.376 0 101.76-34.88 194.752-91.712 270.336L1021.184 925.696 1021.184 925.696zM455.168 129.6c-179.584 0-325.056 144.96-325.056 323.84 0 178.816 145.472 323.84 325.056 323.84 179.456 0 325.056-145.024 325.056-323.84C780.224 274.496 634.624 129.6 455.168 129.6L455.168 129.6z'
const expand = 'M1023.13426849 891.55864801l-848.70963949 0c-15.61966349 0-28.29362182-12.67395833-28.29362182-28.29362182l0-28.29362183c0-15.61966349 12.67395833-28.29362182 28.29362182-28.29362183L1023.13426849 806.67778253A28.29362182 28.29362182 0 0 1 1051.4278903 834.97140436L1051.4278903 863.26502619C1051.4278903 878.88468968 1038.75393199 891.55864801 1023.13426849 891.55864801z m-372.76784872-226.32422079l-396.06119792 0c-15.61966349 0-28.29362182-12.67395833-28.29362183-28.29362183l0-28.29362182c0-15.61966349 12.67395833-28.29362182 28.29362183-28.29362183l396.06119792 0a28.29362182 28.29362182 0 0 1 28.29362183 28.29362183l0 28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362183z m0-226.32422079l-396.06119792 0c-15.61966349 0-28.29362182-12.67395833-28.29362183-28.29362182l-1e-8-28.29362183c0-15.61966349 12.67395833-28.29362182 28.29362184-28.29362182l396.06119792 0a28.29362182 28.29362182 0 0 1 28.29362182 28.29362182l1e-8 28.29362183c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362182zM1023.13426849 212.58598565l-848.70963949 1e-8c-15.61966349 0-28.29362182-12.67395833-28.29362182-28.29362183l0-28.29362183c0-15.61966349 12.67395833-28.29362182 28.29362181-28.29362182L1023.13426849 127.70512018A28.29362182 28.29362182 0 0 1 1051.4278903 155.998742l0 28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362181 28.29362183z m-219.41790365 455.22283936l0-316.32912802a11.33725179 11.33725179 0 0 1 17.82275393-9.25793049L1045.95729502 500.37395359a11.31249797 11.31249797 0 0 1 1e-8 18.49110717l-224.41817627 158.1521871a11.33725179 11.33725179 0 0 1-17.82275392-9.23317667z'
const collapse = 'M167.51156481 125.61099486h848.70963949c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362181v28.29362184c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362182H167.51156481A28.29362182 28.29362182 0 0 1 139.217943 182.19823851V153.90461667C139.217943 138.28495319 151.89190131 125.61099486 167.51156481 125.61099486z m372.76784871 226.32422079h396.06119793c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362182v28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362184h-396.06119793a28.29362182 28.29362182 0 0 1-28.29362182-28.29362184v-28.29362182c0-15.61966349 12.67395833-28.29362182 28.29362182-28.29362182z m0 226.32422078h396.06119793c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362183v28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362183h-396.06119793a28.29362182 28.29362182 0 0 1-28.29362182-28.29362183v-28.29362182c0-15.61966349 12.67395833-28.29362182 28.29362182-28.29362183zM167.51156481 804.58365721h848.70963949c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362184v28.29362181c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362184H167.51156481A28.29362182 28.29362182 0 0 1 139.217943 861.17090086v-28.29362181c0-15.61966349 12.67395833-28.29362182 28.29362181-28.29362184z m219.41790365-455.22283936v316.32912802a11.33725179 11.33725179 0 0 1-17.82275392 9.2579305L144.68853828 516.79568928a11.31249797 11.31249797 0 0 1 0-18.49110718l224.41817626-158.1521871a11.33725179 11.33725179 0 0 1 17.82275392 9.23317668z'
const ellipsis = 'M180.59820247 401.53273459c-60.75699579 0-110.46726541 49.71026963-110.46726541 110.46726541s49.71026963 110.46726541 110.46726541 110.46726541c60.75699579 0 110.46726541-49.71026963 110.46726541-110.46726541S241.35519825 401.53273459 180.59820247 401.53273459zM843.40179753 401.53273459c-60.75699579 0-110.46726541 49.71026963-110.46726541 110.46726541s49.71026963 110.46726541 110.46726541 110.46726541c60.75699579 0 110.46726541-49.71026963 110.46726541-110.46726541S904.15879331 401.53273459 843.40179753 401.53273459zM512 401.53273459c-60.75699579 0-110.46726541 49.71026963-110.46726541 110.46726541s49.71026963 110.46726541 110.46726541 110.46726541c60.75699579 0 110.46726541-49.71026963 110.46726541-110.46726541S572.75699579 401.53273459 512 401.53273459z'
const calendar = 'M770.90765392 557.5111111l-258.90765392 0 0 258.90765392 258.90765392 0L770.90765392 557.5111111zM719.12612386-12.085728l0 103.56306132L304.87387614 91.47733332 304.87387614-12.085728 201.31081482-12.085728l0 103.56306132L149.52928355 91.47733332C92.5696 91.47733332 45.96622222 138.0807111 45.96622222 195.04039466l0 724.94143169c0 56.95968355 46.60337778 103.56306132 103.56306133 103.56306132l724.94143169 0c56.95968355 0 103.56306132-46.60337778 103.56306133-103.56306132L978.03377778 195.04039466c0-56.95968355-46.60337778-103.56306132-103.56306133-103.56306134l-51.78153127 0L822.68918518-12.085728 719.12612386-12.085728zM874.47071645 919.98182755L149.52928355 919.98182755 149.52928355 350.38498724l724.94143169 0L874.47071645 919.98182755z'
const org = 'M890.424889 663.04h-37.660445V473.998222H549.376V360.277333h37.660444c41.585778 0 76.003556-33.792 76.003556-76.003555v-151.324445c0-41.642667-33.792-76.060444-76.003556-76.060444H435.768889c-41.642667 0-76.060444 33.792-76.060445 76.003555v151.381334c0 41.585778 33.792 76.003556 76.003556 76.003555h37.660444v113.720889H170.666667v189.724445h-37.717334c-41.528889 0-76.003556 33.792-76.003555 76.003555v151.324445C56.888889 932.750222 90.680889 967.111111 132.892444 967.111111h151.381334c41.585778 0 76.003556-33.792 76.003555-76.003555V738.986667c0-41.528889-33.792-76.003556-76.003555-76.003556h-37.660445V549.376h530.773334v113.664h-37.660445c-41.585778 0-76.003556 33.792-76.003555 76.003556v151.381333c0 41.585778 33.792 76.060444 76.003555 76.060444h151.324445c41.642667 0 76.060444-33.792 76.060444-76.060444v-151.324445a77.084444 77.084444 0 0 0-76.686222-76.060444zM435.655111 284.273778v-151.324445h151.381333v151.324445H435.768889z m-151.324444 454.769778v151.381333H132.835556v-151.324445h151.381333z m606.094222 151.381333h-151.324445v-151.324445h151.324445v151.324445z'

const keyDown = 'M240.98697401 294.01126208L512 565.02428806 783.01302599 294.01126208 865.4952507 376.49348677 512 729.98873747 158.5047493 376.49348677Z'
const keyLeft = 'M733.64730918 774.88842085L462.6342832 503.87539624 733.64730918 232.86237024 651.1650831 150.38014552 297.6698324 503.87539624 651.1650831 857.37064693Z'
const keyRight = 'M290.35269082 765.33826345L561.3657168 500.21682544 290.35269082 229.20379943 372.8349169 146.72157474 726.3301676 500.21682544 372.8349169 853.71207613Z'
const keyUp = 'M240.98697401 733.64730918L512 462.6342832 783.01302599 733.64730918 865.4952507 651.1650831 512 297.6698324 158.5047493 651.1650831Z'
const expandAll = 'M852.13671875 174.5h-685.546875c-30.32226563 0-55.37109375 25.04882813-55.37109374 55.37109375s25.04882813 55.37109375 55.37109374 55.37109375h685.546875c30.32226563 0 55.37109375-25.04882813 55.37109375-55.37109375s-23.73046875-55.37109375-55.37109375-55.37109375zM372.25390625 448.71874999H166.58984375c-30.32226563 0-55.37109375 25.04882813-55.37109376 55.37109376s25.04882813 55.37109375 55.37109376 55.37109375h205.6640625c30.32226563 0 55.37109375-25.04882813 55.37109375-55.37109375s-23.73046875-55.37109375-55.37109375-55.37109376zM372.25390625 722.9375H166.58984375c-30.32226563 0-55.37109375 25.04882813-55.37109376 55.37109375s25.04882813 55.37109375 55.37109376 55.37109375h206.98242188c14.50195313 0 27.68554688-5.2734375 38.23242187-15.8203125 10.546875-10.546875 15.8203125-23.73046875 15.8203125-39.55078125 0-30.32226563-23.73046875-55.37109375-55.37109375-55.37109375zM715.02734375 846.86328125l205.6640625-342.7734375H509.36328125z'
const collapseAll = 'M857.41015625 174.49999999h-685.54687502C141.54101562 174.49999999 116.49218751 199.54882812 116.49218751 229.87109375s25.04882814 55.37109375 55.37109372 55.37109374h685.54687502c30.32226563 0 55.37109375-25.04882814 55.37109378-55.37109374s-25.04882814-55.37109375-55.37109378-55.37109376zM376.20898437 448.71874998H170.54492187c-30.32226563 0-55.37109375 25.04882814-55.37109374 55.37109377s25.04882814 55.37109375 55.37109375 55.37109376h205.66406249c30.32226563 0 55.37109375-25.04882814 55.37109376-55.37109376s-23.73046875-55.37109375-55.37109375-55.37109377zM376.20898437 722.9375H170.54492187c-30.32226563 0-55.37109375 25.04882814-55.37109374 55.37109376s25.04882814 55.37109375 55.37109375 55.37109374h206.98242186c14.50195313 0 27.68554688-5.2734375 38.2324219-15.8203125 10.54687499-10.54687499 15.8203125-23.73046875 15.82031249-39.55078124 0-30.32226563-23.73046875-55.37109375-55.37109375-55.37109376zM720.30078125 494.86132812l-206.98242188 342.77343751h412.64648438z'

export default {
  ok,
  org,
  close,
  clear,
  search,
  expand,
  collapse,
  ellipsis,
  calendar,
  'key-down': keyDown,
  'key-left': keyLeft,
  'key-right': keyRight,
  'key-up': keyUp,
  'expand-all': expandAll,
  'collapse-all': collapseAll
}
