/* ============================================================================================= */
/* SQUARY v0.1 - The Epic Javascript Square Grid System                                          */
/* https://github.com/Muini/squary.js                                                            */
/* Developed with <3 by Corentin FLACH ( www.corentinflach.fr )                                  */
/* Open source, just let met know if you do something cool !                                     */
/* ============================================================================================= */

var Squary = {

    //Public parameters
    container: null,
    elements: null,
    resolution: 4,
    randomize: false,
    transitionTime: 0.7,
    pixelCorrection: false,

    //Private parameters
    _size: false,
    _debug: false,
    _grid: [],
    _firstLaunch: true,

    //Public methods
    new: function(
        container,
        resolution,
        randomize,
        transitionTime,
        pixelCorrection,
        callback
    ){
        //Initialize everything
        if(this._debug)
            var start = new Date();

        this.container = document.querySelector(container); //Only one object at the time. Possibility to many in the futur

        if(this.container == null){
            console.log("%c Squary Error : The container is not existing or mispelled.","color: red;"); return; }

        this.elements = Array.prototype.slice.call(this.container.children);

        if(this.elements.length<=0){
            console.log("%c Squary Error : No elements found. Make sure to set correcly your container. It will take automatically the children.","color: red;"); return; }

        this.resolution = resolution;
        this.randomize = randomize;
        this.transitionTime = transitionTime;
        this.pixelCorrection = pixelCorrection;


        //Randomization
        if(this.randomize){
            for (var i = this.elements.length; i >= 0; --i)
                this.container.appendChild(this.elements[Math.random() * i | 0]);
            this.elements = this.container.children;
        }

        //Setup the elements CSS
        this.container.style.position = "relative";
        for(var i=0; i<this.elements.length; i++)
        {
            this.elements[i].style.position = "absolute";
            this.elements[i].style.top = 0;
            this.elements[i].style.left = 0;
            this.elements[i].style.overflow = "hidden";
            this.elements[i].style.display = "none";
        }

        //Refresh the grid
        this.refresh();

        var it = this;

        //Delay the resize function to avoid a lots of calculation
        var delay = (function(){
          var timer = 0;
          return function(callback, ms){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
          };
        })();
        //If we resize the window
        window.addEventListener("resize", function(){
            delay(function(){
                it.refresh();
            }, 200);
        });

        if(this._debug){
            var end  = new Date();
            var time = end.getTime() - start.getTime();
            console.log('Timer:', name, 'finished in', time, 'ms');
        }

        console.log("%c Squary's running fine! ","color: darkgreen; background:lightgreen;");

        callback();

        return this;
    },

    refresh: function(){
        //The magic is here
        this._grid = [];

        //Filtering handle
        var newElements = [];
        for(var i=0; i<this.elements.length; i++){
            if(this.elements[i].hasAttribute('squary-hidden')){
                //this.elements[i].style.display = 'none';
                this.elements[i].style.opacity = 0;
                this.elements[i].style.zIndex = -1;
                //this.elements[i].style.top = "40px";
            }else{
                //this.elements[i].style.display = 'block';
                this.elements[i].style.opacity = 1;
                this.elements[i].style.zIndex = 1;
                this.elements[i].style.top = "0px";
                newElements.push(this.elements[i]);
            }
        }
        this.elements = newElements;

        //Let's calculate the size of all the elements
        var elemsSize = 0;
        var minWidthSize = 1;
        var minHeightSize = 1;
        for(var i=0; i<this.elements.length; i++)
        {
            var elemSize = this.elements[i].getAttribute('squary-size');
            if(!elemSize){
                elemsSize++;
            }else{
                elemSize = elemSize.split('x');
                if(elemSize[0]>minWidthSize)
                    minWidthSize = elemSize[0];
                if(elemSize[1]>minHeightSize)
                    minHeightSize = elemSize[1];
                elemSize = elemSize[0]*elemSize[1];
                elemsSize += elemSize;
            }
        }

        //Evaluate how much square I can put on the container
        this._size = Math.round( (this.resolution * this.container.offsetWidth ) / 1024 );

        //Set a minimum of square in the width based on the minimum elem size.
        if(this._size<minWidthSize){
            this._size = minWidthSize;
        }

        if(this._debug)
        {
            console.log("%c Squary debug : Number of elements : "+elemsSize, "color: darkorange;");
            console.log("%c Squary debug : Grid size is : "+this._size+" x "+(parseInt(elemsSize/this._size)+1), "color: darkorange;");
        }

        //Create a matrix sized to the elements
        for(var i=0; i<(parseInt(elemsSize/this._size)+minHeightSize); i++)
        {
            this._grid[i] = [0]; //2 Dimensionnal array
            for(var y=0; y<this._size; y++)
            {
                this._grid[i][y] = 0;
            }
        }

        //Set the height of the container
        var normalSize = parseInt(this.container.offsetWidth)/this._size;
        this.container.style.height =  (parseInt(elemsSize/this._size)+2) * normalSize + "px";

        //For each element, let's see where he can be placed in the grid
        for(var e=0; e<this.elements.length; e++) //e = Element
        {
            var c = -1; //Column
            var l = 0; //Line
            var freeSpacex = 0;
            var freeSpacey = 0;

            var elementsizex = 0;
            var elementsizey = 0;

            var size = this.elements[e].getAttribute('squary-size');
            if(!size){
                elementsizex = elementsizey = 1;
            }else{
                size = size.split('x');
                elementsizex = size[0];
                elementsizey = size[1];
            }

            do
            {
                //Go trought the matrix
                if(c<this._size-1){
                    c++;
                }else{
                    c=0;
                    l++;
                }

                freeSpacex = 0;
                freeSpacey = 0;
                //Is there enough space in X for this element ?

                for(var x=0; x<elementsizex; x++)
                {
                    if( this._grid[l][c+x] == 0 ){
                        freeSpacex++;

                    }else{
                        break;
                    }
                }

                if(freeSpacex == elementsizex){
                    //Is there enough space in y for this element on this collumn ?
                    for(var y=0; y<elementsizey; y++)
                    {
                        if( this._grid[l+y][c] == 0 ){
                            freeSpacey++;
                        }else{
                            break;
                        }
                    }
                }
            }while( freeSpacex*freeSpacey != elementsizex*elementsizey ) //It needs to fit in both x & y

            //Now I know that I have the place to put the element
            for(var x=0; x<elementsizex; x++)
            {
                for(var y=0; y<elementsizey; y++)
                {
                    this._grid[l+y][c+x] = elementsizex*elementsizey;
                }
            }

            var gridsquaresizex = 0
            var gridsquaresizey = 0

            gridsquaresizex =  normalSize * elementsizex;
            gridsquaresizey =  normalSize * elementsizey;

            var pixelcorrection = 0;
            if(this.pixelCorrection)
                pixelcorrection = 1;

            this.elements[e].style.width = gridsquaresizex+pixelcorrection+"px";
            this.elements[e].style.height = gridsquaresizey+pixelcorrection+"px";


            var val = "translate("+normalSize*c+"px,"+normalSize*l+"px) rotateX(0deg)";

            //Animation d'Intro
            if(this._firstLaunch){
                this._recursiveDisplay(e,val);
                val = "translate("+normalSize*c+"px,"+((normalSize*l)+normalSize)+"px) rotateX(90deg)";
            }

            this.elements[e].style.WebkitTransform = val;
            this.elements[e].style.msTransform = val;
            this.elements[e].style.transform = val;

        }

        this._firstLaunch = false;

        //Debug
        if(this._debug)
            this._drawDebugGrid(this._grid);

        return this;
    },

    onClick: function(func){
        for(var i=0; i<this.elements.length; i++){
            this.elements[i].onclick = func;
        }
        return this;
    },

    filter: function(name){

        if(!isNaN(name))
            return;

        this.elements = Array.prototype.slice.call(this.container.children);

        if(name == "all"){
            for(var i=0; i<this.elements.length; i++)
            {
                this.elements[i].removeAttribute('squary-hidden');
            }
        }else{
            for(var i=0; i<this.elements.length; i++)
            {
                var attr = this.elements[i].getAttribute('squary-filter');
                if(this.elements[i].hasAttribute('squary-filter') && name == attr){
                    this.elements[i].removeAttribute('squary-hidden');
                }else{
                    this.elements[i].setAttribute('squary-hidden', 'true');

                    var pos = this.elements[i].getAttribute("style").split("translate(")[1].split(") ")[0];

                    var val = "translate("+pos+") scale(0.7)";

                    this.elements[i].style.WebkitTransform = val;
                    this.elements[i].style.msTransform = val;
                    this.elements[i].style.transform = val;
                    this.elements[i].style.opacity = 0;
                }
            }
        }
        if(name != "all"){
            var it = this;
            setTimeout(function(){ it.refresh(); }, 200);
        }else{
            this.refresh();
        }
        return this;
    },

    getBlock: function(i){
        return this.elements[i];
    },

    setResolution: function(reso){
        this.resolution = reso;
        this.refresh();
        return this;
    },

    setTransitionTime: function(int){
        this.transitionTime = int;
        this.refresh();
        return this;
    },

    //Private methods
    _recursiveDisplay: function(i, to){

        var trans = "all "+this.transitionTime+"s ease-out";
        var it = this;

        this.elements[i].style.display = "inline-block";

        setTimeout(function(){
            //it.elements[i].style.display = "block";

            it.elements[i].style.WebkitTransition = trans;
            it.elements[i].style.msTransition = trans;
            it.elements[i].style.transition = trans;

            it.elements[i].style.WebkitTransform = to;
            it.elements[i].style.msTransform = to;
            it.elements[i].style.transform = to;

        },((1000*this.transitionTime)/this.elements.length)*(i+1))
    },

    _drawDebugGrid: function(){
        this.container.innerHTML = "SQUARY DEBUG GRID :<br />";
        //collumn
        for(var i=0; i<this._grid.length; i++)
        {
            //Line
            for(var y=0; y<this._grid[i].length; y++)
            {
                this.container.innerHTML += this._grid[i][y];
                this.container.innerHTML += " | ";
            }
            this.container.innerHTML += "<br />";
        }
    },
}

