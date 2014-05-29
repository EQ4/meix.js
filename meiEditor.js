(function ($)
{
    var AceMeiEditor = function(element, plugins, options){
        var element = $(element);
        var self = this;
        var settings = {
            dv: "",
            editor: "",
            validatorLink: "mei-Neumes.rng",
            validatorText: "",
        }

        //for topbar plugins
        var previousSizes = {};

        /*
            Minimizes an object.
            @param divID The root ID of the object to minimize.
            @param animateOverride Used at initial load and as needed to skip the jQuery animate function.
        */
        var minimizeObject = function(divID, animateOverride)
        {
            if(typeof animateOverride === undefined)
            {
                animateOverride = false;
            }

            var numMinimized = $(".minimized").length;

            previousSizes[divID] = {
                 'left': $("#" + divID).offset().left,
                 'top': $("#" + divID).offset().top,
                 'width': $("#" + divID).width(),
                 'height': $("#" + divID).height(),
                 'margin': $("#" + divID).css('margin'),
                 'padding': $("#" + divID).css('padding'),
            };

            if(!animateOverride){
                $("#" + divID).animate(
                {
                    'left': numMinimized * 300,
                    'margin': '2px',
                    'width': '290px', //300(actual width) - 4(2 for both margins) - 6(3 for both paddings)
                    'height': 'auto',
                    'top': '0px',
                    'padding': '3px',
                }, 500);
            } else {
                $("#" + divID).css(
                {
                    'left': numMinimized * 300,
                    'margin': '2px',
                    'width': '290px',
                    'height': 'auto',
                    'top': '0px',
                    'padding': '3px',
                });

            }

            $("#" + divID + "-minimized-wrapper").css('display', 'block');
            $("#" + divID + "-maximized-wrapper").css('display', 'none');

            //sortable wasn't working the way I wanted it to so I implemented something manually
            $("#" + divID).draggable(
            {
                axis: "x",
                start: function(e, ui)
                {
                    $(e.target).css('z-index', '1000');
                },
                stop: function(e, ui)
                {
                    console.log("triggered");
                    $(e.target).css('z-index', '5');
                    reorderToolbarObjects();
                },
            });

            $("#" + divID).trigger('minimize');
            $("#" + divID).addClass('minimized');
        };

        /*
            Function called to reorder the toolbar objects.
        */
        var reorderToolbarObjects = function()
        {
            var numMinimized = $(".minimized").length;
            var orderedByLeft = [];

            while(numMinimized--)
            {
                orderedByLeft.push({'id': $($(".minimized")[numMinimized]).attr('id'), 'left': $($(".minimized")[numMinimized]).offset().left});
            }

            var sortedByLeft = jsonSort(orderedByLeft, 'left', true);
            var numMinimized = sortedByLeft.length;
            while(numMinimized--)
            {
                $("#" + sortedByLeft[numMinimized]['id']).animate({'left': numMinimized * 300 + 3}, 500);
            }
        }

        /*
            Maximizes the file list.
            @param divID The root ID of the object to maximize.
        */
        var maximizeObject = function(divID)
        {
            function resetDims()
            {
                $("#" + divID).css('width', 'auto');
                $("#" + divID).css('height', 'auto');
            }

            $("#" + divID).animate(previousSizes[divID], 
            {
                duration: 500,
                complete: resetDims 
            });

            $("#" + divID + "-maximized-wrapper").css('display', 'block');
            $("#" + divID + "-minimized-wrapper").css('display', 'none');
            $("#" + divID).trigger('maximize');
            $("#" + divID).removeClass('minimized');
            reorderToolbarObjects();
            $("#" + divID).draggable(
            {
                axis: "",
                start: "",
                stop: "",
            }); //needed to reset axes and start/stop listeners

        };

        /*
            Function to be called on resizing. Not leaving this anonymous so that it can be called at the beginning without triggering the Diva .resize() listener.
        */
        var resizeComponents = function()
        {
            topbarHeight = $("#topbar").height();
            $("#topbar").css({
                'left': '0.2%',
                'width': '99.6%' 
            });
            $("#container").css({
                'top': topbarHeight,
                'left': '0.2%',
                'width': '99.6%',
                'height': window.height - topbarHeight,
            });
            
            containerWidth = $("#container").width();
            innerMargin = containerWidth * 0.006; //for inner margin
            windowHeight = $(window).height() - topbarHeight - 7; //7 for padding
            
            $("#mei-editor").height(windowHeight);
            $("#diva-wrapper").height(windowHeight);
            $("#editor").height(windowHeight);
            $("#editor").width((containerWidth / 2) - innerMargin);
            $("#diva-wrapper").width((containerWidth / 2) - innerMargin);
        }

        /*
            Stolen with no mercy from http://stackoverflow.com/questions/881510/jquery-sorting-json-by-properties
        */
        var jsonSort = function(jsonObject, prop, asc) 
        {
            newJsonObject = jsonObject.sort(function(a, b) 
            {
                if (asc) return (a[prop] > b[prop]);
                else return (b[prop] > a[prop]);
            });
            return newJsonObject;
        }

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            element.height($(window).height());
            element.append('<div id="topbar">'
                + '</div>' //header
                + '<div id="container">'
                + '<div id="editor"></div>' //ACE editor
                + '<div id="diva-wrapper"></div>' //Diva
                + '<div class="clear"></div>'
                + '<span id="hover-div"></span>' //the div that pops up when highlights are hovered over
                + '</div>' //container for body
                );

            //for each plugin...
            pluginLength = plugins.length;
            while(pluginLength--)
            {
                curPlugin = plugins[pluginLength];
                //append a basic structure
                $("#topbar").append('<div id="' + curPlugin.divName + '" class="toolbar-object">'
                    + '<div id="' + curPlugin.divName + '-maximized-wrapper">'
                    + curPlugin.maximizedAppearance
                    + '</div>'
                    + '<div id="' + curPlugin.divName + '-minimized-wrapper" style="display:none;">'
                    + curPlugin.minimizedAppearance
                    + '</div>'
                    + '</div>'
                    );

                minimizeObject(curPlugin.divName, true);
                $("#"+curPlugin.divName).draggable();

                //call the init function to set up some more stuff
                curPlugin._init(self, settings);
            }            

            //create the diva wrapper and editor
            $('#diva-wrapper').diva(
            {
                contained: true,
                enableAutoHeight: true,
                enableAutoWidth: true,
                fixedHeightGrid: false,
                iipServerURL: "http://132.206.14.136:8000/fcgi-bin/iipsrv.fcgi",
                objectData: "imagesOut.json",
                imageDir: "/opt/stgall",
                enableHighlight: true,
                viewerWidthPadding: 0,
                viewerHeightPadding: 0,
            });
            settings.dv = $('#diva-wrapper').data('diva');

            settings.editor = ace.edit("editor"); //create the ACE editor
            settings.editor.setTheme("ace/theme/ambiance");
            settings.editor.getSession().setMode("ace/mode/xml");

            //various jQuery listeners that have to be put in after the buttons exist
            $(".minimize").on('click', function(event)
            {
                minimizeObject(event.target.name);
            });
            $(".maximize").on('click', function()
            {
                maximizeObject(event.target.name);
            });

            //Events.subscribe("VisiblePageDidChange") - have ACE page automatically update to reflect currently viewed page?

            //little graphics things
            $(window).on('resize', resizeComponents);

            resizeComponents();
        };

        _init();

    }

    $.fn.AceMeiEditor = function (plugins, options)
    {
        return this.each(function ()
        {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('AceMeiEditor'))
                return;

            // Save the reference to the container element
            options.parentSelector = element;

            // Otherwise, instantiate the document viewer
            var meiEditor = new AceMeiEditor(this, plugins, options);
            element.data('AceMeiEditor', meiEditor);
        });
    };

})(jQuery);