
// TODO: use a sandbox like this


// TODO: try wrapping in function and remove _global & _whitelist from _whitelist

var _global = this;

// Most extra functions could be possibly unsafe,
// and new APIs introduced in the future could be unsafe,
// so use a whitelist approach

// TODO: try making this an array? why's it an object?
var _whitelist = {
	"self": 1,
	"onmessage": 1,
	"postMessage": 1,
	"_global": 1,
	"_whitelist": 1,
	"eval": 1,
	"Array": 1,
	"Boolean": 1,
	"Date": 1,
	"Function": 1,
	"Number" : 1,
	"Object": 1,
	"RegExp": 1,
	"String": 1,
	"Error": 1,
	// "EvalError": 1, (who needs it? it's deprecated)
	"RangeError": 1,
	"ReferenceError": 1,
	"SyntaxError": 1,
	"TypeError": 1,
	"URIError": 1,
	"decodeURI": 1,
	"decodeURIComponent": 1,
	"encodeURI": 1,
	"encodeURIComponent": 1,
	"isFinite": 1,
	"isNaN": 1,
	"parseFloat": 1,
	"parseInt": 1,
	"Infinity": 1,
	"JSON": 1,
	"Math": 1,
	"NaN": 1, // is this just in the unlikely case that "window.NaN" is defined?
	"undefined": 1 // is this just in the unlikely case that "window.undefined" is defined?
};

Object.getOwnPropertyNames( _global ).forEach( function( prop ) {
	if( !_whitelist.hasOwnProperty( prop ) ) {
		Object.defineProperty( _global, prop, {
			get : function() {
				throw new Error("Sandbox Security Exception: cannot access " + prop);
			}, 
			configurable : false
		});    
	}
});

Object.getOwnPropertyNames( _global.__proto__ ).forEach( function( prop ) {
	if( !_whitelist.hasOwnProperty( prop ) ) {
		Object.defineProperty( _global.__proto__, prop, {
			get : function() {
				throw new Error("Sandbox Security Exception: cannot access " + prop);
			}, 
			configurable : false
		});    
	}
});

// TODO: this ONE change of behavior seems dubious
// 1. Could we raise the limit, maybe by a few orders of magnitude?
// 2. Are there not other things that can be just as problematic? (RegExps perhaps?)
Object.defineProperty( Array.prototype, "join", {

	writable: false,
	configurable: false,
	enumerable: false,

	value: function(oldArrayJoin){
		return function(arg){
			if( this.length > 500 || (arg && arg.length > 500 ) ) {
				throw new RangeError("too many items to join (reached sandbox limit of 500)");
			}

			return oldArrayJoin.apply( this, arguments );
		};
	}(Array.prototype.join)

});


(function(){
	var cvalues = [];

	var console = {
		log: function(){
			cvalues = cvalues.concat( [].slice.call( arguments ) );
		}
	};

	function objToResult( obj ) {
		var result = obj;
		switch( typeof result ) {
			case "string":
				return '"' + result + '"';
				break;
			case "number":
			case "boolean":
			case "undefined":
			case "null":
			case "function":
				return result + "";
				break;
			case "object":
				if( !result ) {
					return "null";
				}
				else if( result.constructor === Object || result.constructor === Array ) {
					var type = ({}).toString.call( result );
					var stringified;
					try {
						stringified = JSON.stringify(result);
					}
					catch(e) {
						return ""+e;
					}
					return type + " " + stringified;
				}
				else {
					return ({}).toString.call( result );
				}
				break;

		}

	}

	onmessage = function( event ) {
		"use strict";
		var code = event.data.code;
		var result;
		try {
			result = eval( '"use strict";\n'+code );
		}
		catch(e) {
			postMessage( e.toString() );
			return;
		}
		result = objToResult( result );
		if( cvalues && cvalues.length ) {
			result = result + cvalues.map( function( value, index ) {
				return "Console log "+(index+1)+":" + objToResult(value);
			}).join(" ");
		}
		postMessage( (""+result).substr(0,400) );
	};

})();
