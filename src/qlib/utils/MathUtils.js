/*
* Circle
*
* Copyright (c) 2013 Mario Klingemann
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// namespace:
window["qlib"] = window.qlib || {};

(function() {

	var MathUtils = function() {}
	
	// static methods:
	MathUtils.GLSL = function( m)
	{
		var q, i, j, k;
		for ( j = 0; j < 3; j++) 
		{
			q = m[ j * 5 ];
			
			if (q == 0) 
			{
				for ( i = j + 1; i < 3; i++) 
				{
					if ( m [ i * 4 + j ] != 0 )
					{
						for ( k = 0; k < 4; k++) 
						{
							m[ j * 4 + k] += m[ i * 4 + k ];
						}
						q = m[ j * 5 ];
						break;
					}
				}
			}
			
			if (q != 0) 
			{
				for ( k = 0; k < 4; k++)
				{
					m[j * 4 + k] = m[j * 4 + k]  / q;
				}
			}
			
			for ( i = 0; i < 3; i++)
			{
				if ( i != j )
				{
					q = m[ i * 4 + j ];
					for ( k=0; k < 4; k++)
					{
						m[ i * 4 + k] -= q * m[j * 4 + k];
					}
				}
			}
		}
		
	}
	
	qlib["MathUtils"] = MathUtils;
}());