(function ($)
{
    var AceMeiEditor = function(element, aceEditor){
        var element = $(element);
        var self = this;
        var activeDoc;
        var currentPage;
        var currentDocPosition = {'row': 1, 'col': 1};
        var pageData = {};
        var orderedPageData = [];
        var neumeObjects = [];
        var currentTarget;
        var dv;
        var editor;
        var editorWidth = .5; //how much of the screen this takes up
        var validatorLink = "mei-Neumes.rng";
        var validatorText;

        //for topbar plugins
        var numMinimized = 0;
        var previousSizes = {};

        /*
            Function called when new load/save buttons are created to refresh the listeners.
        */
        var reapplyButtonListeners = function()
        {
            $(".meiLoad").on('click', function(e)
            {
                fileName = $(e.target).attr('pageTitle'); //grabs page title from custom attribute
                self.changeActivePage(fileName);
            });

            $(".meiSave").on('click', function(e)
            {
                fileName = $(e.target).attr('pageTitle'); //grabs page title from custom attribute
                self.savePageToClient(fileName);
            });

            $(".meiValidate").on('click', function(e)
            {
                fileName = $(e.target).attr('pageTitle'); //grabs page title from custom attribute
                self.validateMei(fileName);
            });
        };

        /*
            Function called when sections are rehighlighted to refresh the listeners.
        */
        var reapplyHoverListener = function()
        {
            $(".overlay-box").hover(function(e) //when the hover starts for an overlay-box
            {
                currentTarget = e.target.id;

                $("#hover-div").html(neumeObjects[currentTarget]);
                $("#hover-div").css(//create a div with the name of the hovered neume
                {
                    'top': e.pageY - 50,
                    'height': 40,
                    'left': e.pageX,
                    'padding-left': '10px',
                    'padding-right': '10px',
                    'border': 'thin black solid',
                    'background': '#FFFFFF',
                    'display': 'block',
                    'vertical-align': 'middle',
                });
                //change the color of the hovered div
                $("#"+currentTarget).css('background-color', 'rgba(255, 255, 255, 0.05)');

                $(document).on('mousemove', function(e) //have it follow the mouse
                {
                    $("#hover-div").css(
                    {
                        'top': e.pageY - 50,
                        'left': e.pageX,
                    });
                });
            }, function(e){
                currentTarget = e.target.id;
                $(document).unbind('mousemove'); //stops moving the div
                $("#hover-div").css('display', 'none'); //hides the div
                $("#hover-div").html("");

                $("#"+currentTarget).css('background-color', 'rgba(255, 0, 0, 0.2)'); //color is normal again
            });
        };

        /*
            Minimizes the file list.
        */
        var minimizeObject = function(divID){
            //previousWidth = $("#file-upload").width(); //needed to make it look nice. could take this out.
            previousSizes[divID] = 
            {
                 'left': $("#"+divID).offset().left,
                 'top': $("#"+divID).offset().top,
                 'width': $("#"+divID).width(),
                 'height': $("#"+divID).height(),
                 'margin': $("#"+divID).css('margin'),
                 'padding': $("#"+divID).css('padding'),
            };

            //get it out of the way
            $("#"+divID).animate(
            {
                'left': numMinimized*200,
                'margin': '2px',
                'width': '196px',
                'height': 'auto',
                'top': '0px',
                'padding': '3px',
            }, 500);
            $("#"+divID+"-minimized-wrapper").css('display', 'block');
            $("#"+divID+"-maximized-wrapper").css('display', 'none');
            numMinimized += 1;
        };

        /*
            Maximizes the file list.
        */
        var maximizeObject = function(divID){
            function resetDims(){
                $("#"+divID).css('width', 'auto');
                $("#"+divID).css('height', 'auto');
            }
            $("#"+divID).animate(previousSizes[divID], 
            {
                duration: 500,
                complete: resetDims 
            });
            $("#"+divID+"-maximized-wrapper").css('display', 'block');
            $("#"+divID+"-minimized-wrapper").css('display', 'none');
            numMinimized -= 1;
        };

        /*
            Reorders the MEI files in the data to reflect the GUI.
            @param newOrder A list of the filenames in the desired order.
        */
        var reorderFiles = function(newOrder)
        {
            orderedPageData = [];
            var curPage = 0;
            while(curPage < newOrder.length) //go through new order 
            {
                orderedPageData.push(newOrder[curPage]); //push them into ordered array
                curPage++;
            }
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
            Creates highlights based on the ACE documents.
        */
        this.createHighlights = function()
        {           
            var x2js = new X2JS(); //from xml2json.js
            var pageIndex = orderedPageData.length;
            dv.resetHighlights();
            while(pageIndex--)
            { //for each page
                curPage = orderedPageData[pageIndex];
                pageText = pageData[curPage].doc.getAllLines().join("\n"); //get the information from the page expressed in one string
                jsonData = x2js.xml_str2json(pageText); //turn this into a JSON "dict"
                regions = [];

                xmlns = jsonData['mei']['_xmlns'] //find the xml namespace file
                var neume_ulx, neume_uly, neume_width, neume_height;
                neumeArray = jsonData['mei']['music']['body']['neume'];
                facsArray = jsonData['mei']['music']['facsimile']['surface']['zone'];
                for (curZoneIndex in facsArray) //for each "zone" object
                { 
                    curZone = facsArray[curZoneIndex];
                    neumeID = curZone._neume;
                    for (curNeumeIndex in neumeArray) //find the corresponding neume - don't think there's a more elegant way in JS
                    { 
                        if (neumeArray[curNeumeIndex]["_xml:id"] == neumeID)
                        {
                            curNeume = neumeArray[curNeumeIndex]; //assemble the info on the neume
                            neumeObjects[neumeID] = curNeume['_name']
                            neume_ulx = curZone._ulx;
                            neume_uly = curZone._uly;
                            neume_width = curZone._lrx - neume_ulx;
                            neume_height = curZone._lry - neume_uly;
                            break;
                        }
                    }
                    //add it to regions
                    regions.push({'width': neume_width, 'height': neume_height, 'ulx': neume_ulx, 'uly': neume_uly, 'divID': neumeID});
                }
                //at the end of each page, call the highlights
                dv.highlightOnPage(pageIndex, regions, undefined, "overlay-box", reapplyHoverListener);
            }
        };

        /*
            Changes the active page in the editor.
            @param pageName The page to switch to.
        */
        this.changeActivePage = function(pageName)
        {
            editor.setSession(pageData[pageName]); //inserts text
            activeDoc = editor.getSession().doc;
        };

        /*
            Prompts local download of a page.
            @param pageName The page to download.
        */
        this.savePageToClient = function(pageName)
        {
            formatToSave = function(lineIn, indexIn)
            {          
                if(lineIn !== "") //if the line's not blank (nothing in MEI should be)
                {
                    formattedData[indexIn] = lineIn + "\n"; //add a newline - it doesn't use them otherwise. Last line will have a newline but this won't stack when pages are re-uploaded as this also removes blank lines.
                }
            }

            var formattedData = [];
            var lastRow = pageData[pageName].doc.getLength() - 1; //0-indexed
            pageData[pageName].doc.getLines(0, lastRow).forEach(formatToSave); //format each
            var pageBlob = new Blob(formattedData, {type: "text/plain;charset=utf-8"}); //create a blob
            saveAs(pageBlob, pageName); //download it! from FileSaver.js
        };


        /* 
            Validates MEI using the locally-hosted .RNG file
            @param pageName The page to validate.
        */
        this.validateMei = function(pageName)
        {
            var Module = 
            {
                xml: pageData[pageName].doc.getAllLines().join("\n"),
                schema: validatorText,
                //arguments: ["--noout", "--relaxng", "http://localhost:8000/mei-Neumes.rng", "http://localhost:8000/mei/015.xml"]
            }
            validationWorker = new Worker("xmllintNew.js");
            validationWorker.onmessage = function(event){
                console.log(event.data);
            }
            validationWorker.postMessage(Module);
        }

        /*
            Adds a page to the database
            @param pageDataIn The result of a FileReader.readAsText operation containing the data from the MEI file.
            @param fileNameIn The name of the file to be referenced in the database.
        */
        this.addPage = function(pageDataIn, fileNameIn)
        {
            pageData[fileNameIn] = new ace.EditSession(pageDataIn, "ace/mode/xml"); //add the file's data into a "pageData" array that will eventually feed into the ACE editor
            orderedPageData.push(fileNameIn); //keep track of the page orders to push the right highlights to the right pages
        };

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            element.height($(window).height());
            element.append('<div id="topbar">'
                +'<div id="file-upload">' //the file upload 
                +'<div id="file-upload-maximized-wrapper">' //what shows when it's maximized
                +'<input type="file" value="Add a new file" id="fileInput">' 
                +'<div id="file-list">Files loaded:<br></div>'
                +'<button id="updateDiva">Update DIVA</button>'
                +'<button id="minimizeFileUpload" style="float:right;">Minimize</button>'
                +'</div>'
                +'<div id="file-upload-minimized-wrapper" style="display:none;">' //or when it's minimized
                +'<span id="file-list">Files loaded:</span>'
                +'<button id="maximizeFileUpload" style="float:right;">Maximize</button>'
                +'</div>'
                +'</div>'
                +'</div>' //header
                +'<div id="container">'
                +'<div id="editor"></div>' //ACE editor
                +'<div id="diva-wrapper"></div>' //Diva
                +'<div class="clear"></div>'
                +'<span id="hover-div"></span>' //the div that pops up when highlights are hovered over
                +'</div>' //container for body
                );

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
            dv = $('#diva-wrapper').data('diva');

            editor = ace.edit("editor"); //create the ACE editor
            editor.setTheme("ace/theme/ambiance");
            editor.getSession().setMode("ace/mode/xml");

            //various jQuery listeners that have to be put in after the buttons exist
            $("#updateDiva").on('click', self.createHighlights);
            $("#minimizeFileUpload").on('click', function()
            {
                minimizeObject("file-upload");
            });
            $("#maximizeFileUpload").on('click', function()
            {
                maximizeObject("file-upload");
            });

            //Events.subscribe("VisiblePageDidChange") - have ACE page automatically update to reflect currently viewed page?

            //load in the XML validator

            $.ajax(
            {
                url: validatorLink,
                success: function(data)
                {
                    validatorText = data;
                }
            });

            //when a new file is uploaded; easier to write inline than separately because of the "this" references
            $('#fileInput').change(function(e)
            { 
                var reader = new FileReader();
                reader.file = this.files[0];

                //when the file is loaded as text
                reader.onload = function(e) 
                { 
                    fileName = this.file.name
                    self.addPage(this.result, fileName);
                    $("#file-list").html($("#file-list").html()
                        +"<div class='meiFile' id='"+fileName+"'>"+fileName
                        +"<button class='meiLoad' pageTitle='"+fileName+"'>Load</button>"
                        +"<button class='meiSave' pageTitle='"+fileName+"'>Save</button>"
                        +"<button class='meiValidate' pageTitle='"+fileName+"'>Validate</button>"
                        +"</div>"); //add the file to the GUI
                    reapplyButtonListeners();
                };
                reader.readAsText(this.files[0]);
            });

            //various jQueryUI designators
            $("#file-upload").draggable();
            $("#file-list").sortable();
            $("#file-list").disableSelection();
            $("#file-list").on("sortstop", function(e, ui) //when dragging a sortable item ends
            {
                fileList = $(".meiFile"); //gets a list of all objects with the "meiFile" class
                newOrder = [];
                numberOfFiles = $(".meiFile").length;
                for(curFileIndex = 0; curFileIndex < numberOfFiles; curFileIndex++)
                {
                    newOrder.push(fileList[curFileIndex].id); //creates an array with the new order
                }
                reorderFiles(newOrder);
            });

            //little graphics things
            $(window).on('resize', resizeComponents);

            resizeComponents();
        };

        _init();

    }

    $.fn.AceMeiEditor = function (options)
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
            var meiEditor = new AceMeiEditor(this, options);
            element.data('AceMeiEditor', meiEditor);
        });
    };

})(jQuery);