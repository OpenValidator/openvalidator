(function($) {
    $.fn.bootstrapValidator.i18n.date = $.extend($.fn.bootstrapValidator.i18n.date || {}, {
        'default': 'Please enter a valid date',
        min  : 'Please enter a date after %s',
        max  : 'Please enter a date before %s',
        range : 'Please enter a date in the range %s - %s'
    });

    $.fn.bootstrapValidator.validators.date = {
        html5Attributes: {
            message: 'message',
            format: 'format',
            min: 'min',
            max: 'max',
            separator: 'separator'
        },

        /**
         * Return true if the input value is valid date
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - message: The invalid message
         * - min: the minimum date
         * - max: the maximum date
         * - separator: Use to separate the date, month, and year.
         * By default, it is /
         * - format: The date format. Default is MM/DD/YYYY
         * The format can be:
         *
         * i) date: Consist of DD, MM, YYYY parts which are separated by the separator option
         * ii) date and time:
         * The time can consist of h, m, s parts which are separated by :
         * ii) date, time and A (indicating AM or PM)
         * @returns {Boolean|Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            options.format = options.format || 'MM/DD/YYYY';

            // #683: Force the format to YYYY-MM-DD as the default browser behaviour when using type="date" attribute
            if ($field.attr('type') === 'date') {
                options.format = 'YYYY-MM-DD';
            }

            var formats    = options.format.split(' '),
                dateFormat = formats[0],
                timeFormat = (formats.length > 1) ? formats[1] : null,
                amOrPm     = (formats.length > 2) ? formats[2] : null,
                sections   = value.split(' '),
                date       = sections[0],
                time       = (sections.length > 1) ? sections[1] : null;

            if (formats.length !== sections.length) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            // Determine the separator
            var separator = options.separator;
            if (!separator) {
                separator = (date.indexOf('/') !== -1) ? '/' : ((date.indexOf('-') !== -1) ? '-' : null);
            }
            if (separator === null || date.indexOf(separator) === -1) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            // Determine the date
            date       = date.split(separator);
            dateFormat = dateFormat.split(separator);
            if (date.length !== dateFormat.length) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            var year  = date[$.inArray('YYYY', dateFormat)],
                month = date[$.inArray('MM', dateFormat)],
                day   = date[$.inArray('DD', dateFormat)];

            if (!year || !month || !day || year.length !== 4) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            // Determine the time
            var minutes = null, hours = null, seconds = null;
            if (timeFormat) {
                timeFormat = timeFormat.split(':');
                time       = time.split(':');

                if (timeFormat.length !== time.length) {
                    return {
                        valid: false,
                        message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                    };
                }

                hours   = time.length > 0 ? time[0] : null;
                minutes = time.length > 1 ? time[1] : null;
                seconds = time.length > 2 ? time[2] : null;

                // Validate seconds
                if (seconds) {
                    if (isNaN(seconds) || seconds.length > 2) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                    seconds = parseInt(seconds, 10);
                    if (seconds < 0 || seconds > 60) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                }

                // Validate hours
                if (hours) {
                    if (isNaN(hours) || hours.length > 2) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                    hours = parseInt(hours, 10);
                    if (hours < 0 || hours >= 24 || (amOrPm && hours > 12)) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                }

                // Validate minutes
                if (minutes) {
                    if (isNaN(minutes) || minutes.length > 2) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                    minutes = parseInt(minutes, 10);
                    if (minutes < 0 || minutes > 59) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                }
            }

            var valid, message;

            // Validate day, month, and year
            valid   = $.fn.bootstrapValidator.helpers.date(year, month, day);
            message = options.message || $.fn.bootstrapValidator.i18n.date['default'];

            // declare the date, min and max objects
            var min = null, max = null,
                minOption = options.min, maxOption = options.max;

            if(minOption) {
                if(isNaN(Date.parse(minOption))) {
                    minOption = validator.getDynamicOption($field, minOption);
                }
                min = minOption instanceof Date ? minOption : this._parseDate(minOption, dateFormat, separator);

                // In order to avoid displaying a date string like "Mon Dec 08 2014 19:14:12 GMT+0000 (WET)"
                minOption = minOption instanceof Date ? this._dateFormater(minOption, options.format) : minOption;
            }

            if(maxOption) {
                if(isNaN(Date.parse(maxOption))) {
                    maxOption = validator.getDynamicOption($field, maxOption);
                }
                max = maxOption instanceof Date ? maxOption : this._parseDate(maxOption, dateFormat, separator);

                // In order to avoid displaying a date string like "Mon Dec 08 2014 19:14:12 GMT+0000 (WET)"
                maxOption = maxOption instanceof Date ? this._dateFormater(maxOption, options.format) : maxOption;
            }

            date = new Date(year, month - 1, day, hours, minutes, seconds);

            switch(true) {
                case(minOption && !maxOption && valid):
                    valid   = date.getTime() >= min.getTime();
                    message = options.message || $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.date.min, minOption);
                    break;

                case(maxOption && !minOption && valid):
                    valid   = date.getTime() <= max.getTime();
                    message = options.message || $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.date.max, maxOption);
                    break;

                case(maxOption && minOption && valid):
                    valid   = date.getTime() <= max.getTime() && date.getTime() >= min.getTime();
                    message = options.message || $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.date.range, [minOption, maxOption]);
                    break;
            }

            return {
                valid: valid,
                message: message
            };
        },

        /**
         * Return a date object after parsing the date string
         *
         * @param {String} date   The date string to parse
         * @param {String} format The date format
         * The format can be:
         *   - date: Consist of DD, MM, YYYY parts which are separated by the separator option
         *   - date and time:
         *     The time can consist of h, m, s parts which are separated by :
         * @param {String} separator The separator used to separate the date, month, and year
         * @returns {Date}
         */
        _parseDate: function(date, format, separator) {
            var year, month, day, minutes = 0, hours = 0, seconds = 0,
                sections    = date.split(' '),
                dateSection = sections[0],
                timeSection = (sections.length > 1) ? sections[1] : null;

            dateSection  = dateSection.split(separator);
            year  = dateSection[$.inArray('YYYY', format)];
            month = dateSection[$.inArray('MM', format)];
            day   = dateSection[$.inArray('DD', format)];
            if(timeSection) {
                timeSection = timeSection.split(':');
                hours       = timeSection.length > 0 ? timeSection[0] : null;
                minutes     = timeSection.length > 1 ? timeSection[1] : null;
                seconds     = timeSection.length > 2 ? timeSection[2] : null;
            }

            return new Date(year, month - 1, day, hours, minutes, seconds);
        },

        /**
         * This function is based on the dateFormat function from the Date Format 1.2.3
         * Credit to (c) 2007-2009 Steven Levithan <stevenlevithan.com>
         * MIT license
         * see http://blog.stevenlevithan.com/archives/date-time-format for the complete lib
         *
         * Return the date string formatted following the format provided as param
         *
         * @param {Date} date      The date object to format
         * @param {String} format  The date format
         * The format can be:
         *   - date: Consist of DD, MM, YYYY parts which are separated by the separator option
         *   - date and time:
         *     The time can consist of h/hh/H/HH, M/MM, s/ss parts which are separated by :
         * with
         *      d	   Day of the month as digits; no leading zero for single-digit days.
         *      dd	   Day of the month as digits; leading zero for single-digit days.
         *      m	   Month as digits; no leading zero for single-digit months.
         *      mm	   Month as digits; leading zero for single-digit months.
         *      yy	   Year as last two digits; leading zero for years less than 10.
         *      yyyy   Year represented by four digits.
         *      h	   Hours; no leading zero for single-digit hours (12-hour clock).
         *      hh	   Hours; leading zero for single-digit hours (12-hour clock).
         *      H	   Hours; no leading zero for single-digit hours (24-hour clock).
         *      HH	   Hours; leading zero for single-digit hours (24-hour clock).
         *      M	   Minutes; no leading zero for single-digit minutes.
         *             Uppercase M unlike CF timeFormat's m to avoid conflict with months.
         *      MM	   Minutes; leading zero for single-digit minutes.
         *             Uppercase MM unlike CF timeFormat's mm to avoid conflict with months.
         *      s	   Seconds; no leading zero for single-digit seconds.
         *      ss	   Seconds; leading zero for single-digit seconds.
         * @returns {String}
         */
        _dateFormater: function(date, format) {
            format = format.replace(/Y/g, "y")      // Replace the Y in year with LowerCase one
                           .replace(/M/g, "m")      // Replace the M in month with LowerCase one
                           .replace(/D/g, "d")      // Replace the D in day with LowerCase one
                           .replace(/:m/g, ":M")    // Replace the minute character with UpperCase one
                           .replace(/:mm/g, ":MM")
                           .replace(/:S/, ":s")     // Replace the second character with LowerCase one
                           .replace(/:SS/, ":ss");

            var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMs])\1?|"[^"]*"|'[^']*'/g,
                pad = function (val, len) {
                    val = String(val);
                    len = len || 2;
                    while (val.length < len)
                        val = "0" + val;
                    return val;
                };

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date;

            if (isNaN(date)) {
                throw new SyntaxError("invalid date");
            }

            format = String(format);

            var	d = date["getDate"](),
                m = date["getMonth"](),
                y = date["getFullYear"](),
                H = date["getHours"](),
                M = date["getMinutes"](),
                s = date["getSeconds"](),
                flags = {
                    d:    d,
                    dd:   pad(d),
                    m:    m + 1,
                    mm:   pad(m + 1),
                    yy:   String(y).slice(2),
                    yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12),
                    H:    H,
                    HH:   pad(H),
                    M:    M,
                    MM:   pad(M),
                    s:    s,
                    ss:   pad(s)
                };

            return format.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        }
    };
}(window.jQuery));
