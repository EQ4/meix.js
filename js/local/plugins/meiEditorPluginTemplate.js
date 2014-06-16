/*

This line is require.js syntax - the first parameter is an array of prerequistes
for this class. External links are acceptable, as are local links. The first 
object, 'meiEditor', refers to a path defined in meiEditorPreloader.js and 
should be left in to make sure that the AceMeiEditor class exists; delete 
'link/to/other/includes' and add your own.

NOTE: Do not include the ".js" extension. require.js automatically appends 
it.

*/
require(['meiEditor', 'link/to/other/includes'], function(){

/*

This function is called automatically when this JavaScript file is included.
Each plugin is automatically appended to window.meiEditorPlugins, an array that 
is traversed in the AceMeiEditor class definition. Pushing a function and 
returning a large json object with specific parameters treats will eventually 
extend the AceMeiEditor class. 

*/
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
/*

All four of these values (divName, title, dropdownOptions, and init) are
required and are automatically implemented by the AceMeiEditor class. 

Each plugin is displayed as a Bootstrap dropdown menu/button along the top 
navbar. 
-divName is the id given to the navbar object. 
-title is the text visible on the top navbar
-dropdownOptions is a json object with the syntax 'Dropdown object title': 'id 
    of the dropdown object'. The id is for your use; chain a jQuery on-click 
    event on it to be able to provide functionality. This parameter is optional,
    and if you choose not to use it, the navbar object will be only a button and
    will not dropdown on click.
-requiredSettings is a list of all parameters that the plugin expects to be 
    passed in via the meiEditorSettings object. If one of these is not included,
    the editor will pass a console.error() message and the plugin will be 
    disabled for that pageload. This is optional.
-init is where the functionality of your plugin is imported into the 
    AceMeiEditor class. It will be called with two parameters: meiEditor, a 
    pointer to all functions that are a part of the AceMeiEditor class, and 
    meiEditorSettings, a pointer to all the settings that are a part of the 
    AceMeiEditor class. They can be extended as you wish. More documentation 
    follows.

*/
            divName: "my-plugin", 
            title: "My Plugin!", //text for the dropdown div, required
            dropdownOptions: //the <li> objects present when the dropdown is clicked
            {
                'First dropdown...': 'first-dropdown',
                'Second dropdown...': 'second-dropdown',
                //'Dropdown title': 'id for dropdown'
            },
            requiredSettings: ['setting1', 'setting2'],
            init: function(meiEditor, meiEditorSettings)
            {
/*

The icon pane on each open file can be extended using 
meiEditorSettings.iconPane, an array composed of JSON objects. The key for each 
object will be used as the class for all icons on the page; you can access the
page name using jQuery's .parent() function; see meiEditor.js for an example of 
how this function is used. The object properties are as follows:
-title: Title-text shown when the user hovers over the image
-src: The background image for the icon span. Glyphicons work fine.
-click: A function to be applied as a jQuery event listener when the icon is
    clicked on.

If you use this, leave the $.extend(iconPane, localIcons) call in immediately 
after. Extending the iconPane is optional and occurs in the plugin class rather
than the main file.

*/
                var localIcons = {
                    "className": {
                        'title': 'What shows on hover',
                        'src': 'img/backgroundImageSource.png',
                        'click': function(e){
                            whatHappensWhenYouClickTheIcon();
                        }
                    },
                    "class2name": //...
                };

                $.extend(meiEditorSettings.iconPane, localIcons);

/*

To add settings to the meiEditorSettings object, use jQuery.extend as well.

*/

                $.extend(meiEditorSettings, {
                    newSettings: 'newVal',
                });

/*

An example of how to chain events off the dropdown/navbar objects. The same 
syntax applies if dropdownOptions is left empty; just use #divName as the
selector instead of the dropdown option's ID.

*/

                $("#first-dropdown").on('click', function()
                {
                    //...
                });

/*

An example of a streamlined way to spawn a modal off a dropdown/navbar object.
The meiEditor class contains a function, createModal, to build a Bootstrap modal
automatically and avoid adding ~15 lines of HTML manually. The parameters are:

-The id for the modal so it can be displayed (see below)
-A boolean value where true spawns a small modal and false spawns a larger modal
-The body of the modal, in plain text or html.
-The primary button (rightmost and usually coloured) of the modal.

*/

                meiEditor.createModal('idForTheModal', smallModal, 'Body of the modal', 'Primary Button On Modal');

/*

To spawn the modal, use the builtin Bootstrap function and call .modal() on its
selector (the first parameter of the function above). In this example, it is 
called off clicking the second dropdown option.

*/
                $("#second-dropdown").on('click', function()
                {
                    $("#idForTheModal").modal();
                });

/*

meix.js comes with a custom undo manager library with four functions of note.
Calling undoManager.undo() or undoManager.redo() will navigate through the stack
and pop the newest action. undoManager.save() takes two parameters, the unique
identifier for what type of event it is (discussed shortly), and the parameters
for said event. undoManager.newAction() takes up to three parameters:
-Unique identifier
-A function that is called when "undo" is called on this specific type. The 
    current state (top item on the undo stack) of the document is appended 
    as the final parameter to be accessed if needed. 
-A function that is called when "redo" is called on this specific type. Same as 
    above, but is optional. If this is not provided, the function for "undo" is
    called. 

This library is still under development, and an example of its use can be found 
by the PageEdited undo type in meiEditor.js. The function for "undo" and "redo" 
is the same as, regardless, only the text of documents/active document/cursor
positions are changed. The current states of all three are passed in as 
parameters for the "PageEdited" action; the function uses these to replace 
the current state of the GUI.

*/

                meiEditorSettings.undoManager.newAction("TypeOfUndo", function(params){});

/*

meix.js also comes with an events library. This library has three functions,
publish, subscribe, and unsubscribe. Documentation for this is available in 
the meiEditor.js file.

*/
                meiEditor.events.publish("NewEvent", [params]);
                meiEditor.events.subscribe("ThisEventExists", function(params){});

/*

Finally, meix.js comes with a console interface. To write to this console, use 
the meiEditor.localLog() function. This only takes one parameter - make sure to
manually concatenate strings into one string before or while calling it.

*/
                meiEditor.localLog("Text!");

/*

Functions can be created either as locally accessible or accessible from the API
by appending them as properties of the meiEditor object.

*/

                var thisFunctionIsOnlyLocal = function()
                {

                }

                meiEditor.newFunction = function()
                {

                }

/*

If init() does not return true, the plugin is considered to be disabled and 
anything that was added is immediately removed.

*/

                return true;
            }
        }

/*

Everything below this line is needed to make sure every plugin acts the same way
and is added into the DOM correctly.

*/
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});