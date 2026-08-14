# TODO

Development tasks, from near-term to exploratory feature plans.

## In Progress

## Next Up

- [ ] Redeploy to Vercel to pick up the security header fixes committed at
      `31fc0213` (live site was not yet redeployed as of the last check)

## Backlog

### WebTop Variant

- [ ] SSH Client
- [ ] Progressive Web App
  - [ ] Offline support ([next-offline](https://github.com/hanford/next-offline))
  - [ ] Service Worker firewall ([Mock Service Worker](https://github.com/mswjs/msw))

### Medium Priority

- [ ] System Tray Icons
- [ ] Email App (open SMTP server + [openpgpjs](https://github.com/openpgpjs/openpgpjs))
- [ ] Task Manager ([stats.js](https://github.com/mrdoob/stats.js))
- [ ] Batch File Support

### Programming Languages

- [ ] JVM support ([CheerpJ](https://labs.leaningtech.com/blog/cheerpj-3.0))
- [ ] Go support ([GopherJS](https://github.com/gopherjs/gopherjs))

### Window Management

- [ ] Wayland ([Greenfield](https://github.com/udevbe/greenfield))

### Calendar

- [ ] Calendar app ([react-big-calendar](https://github.com/jquense/react-big-calendar))
- [ ] iCAL support ([ical.js](https://github.com/kewisch/ical.js))

### File Systems

- [ ] [native-file-system-adapter](https://github.com/jimmywarting/native-file-system-adapter)
- [ ] [WebDAV](https://github.com/perry-mitchell/webdav-client)
- [ ] [harextract](https://github.com/JC3/harextract)

### File Information

- [ ] EXIF support ([Exif.js](https://github.com/exif-js/exif-js) or [EXIFR](https://github.com/MikeKovarik/exifr))

### Terminal Enhancements

- [ ] SSH ([SSHy](https://github.com/stuicey/SSHy) or [ssheasy](https://github.com/hullarb/ssheasy))

## Done

- [x] Fix security findings from SECURITY_REVIEW.md (`1dd67da6`)
- [x] Serve security headers on static-export deploys (Vercel) (`31fc0213`)
