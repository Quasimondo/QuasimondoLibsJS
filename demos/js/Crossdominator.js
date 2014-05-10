/*

Crossdominator - A hack for cross-domain pixel access

This tool uses a bug in Adobe® Flash™ to allow pixel access
to images that are usually blocked due to cross-domain
limitations. This tool is not endorsed or supported by Adobe®.

Thanks to @makc3d for pointing out the exploit.

Version: 	0.1
Author:		Mario Klingemann
Contact: 	mario@quasimondo.com
Website:	http://www.quasimondo.com/Crossdominator

Copyright (c) 2014 Mario Klingemann

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

var cdJobLUT;

function loadCrossdomainURL( url, canvasID, completeCallbackObject, completeCallbackMethod )
{
       if ( cdJobLUT == null ) 
	   {
			cdJobLUT = {};
	   }
       cdJobLUT[url] = {canvasID:canvasID,completeCallbackObject:completeCallbackObject,completeCallbackMethod:completeCallbackMethod};
	   
	  var cd = document.getElementById("Crossdominator");
	  cd.loadImageFromURL( url );
}

function onImageLoaded( url, width, height, data )
{
        var d;
        var j = 0;
        var i = 0;
        var rpl = [0,0,1];
        var job =  cdJobLUT[url];
        var cvs = document.getElementById( job.canvasID );
		cvs.width = width;
		cvs.height = height;
        var context = cvs.getContext("2d");
        var imageData = context.createImageData( width, height );
        var iData = imageData.data;
        while ( i < data.length )
        {
           iData[j++] = ( ( d = data.charCodeAt(i++) ) != 1 ? d : rpl[ data.charCodeAt(i++) ] );
        }
        
        context.putImageData( imageData, 0 ,0 );
		if ( job.completeCallbackObject ) job.completeCallbackMethod.apply(job.completeCallbackObject);
		delete cdJobLUT[url];
}
