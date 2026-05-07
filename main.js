
var config = {
    "name" : "comp-click-test",
    "props": ['message'],
    "template": 
        `
        <style>
            h3 {font-style: italic;} 
        </style>
        <div>Click Test:  <h3><b> Click Here for the current time </b></h3><br />
        
        `,
    "init" : function() {
        this.getComp().addEventListener('click', e => {
			this.getComp().querySelector("b").innerHTML = " DOM - Clicked: " + new Date();
		});
    },
    watch : function(attribute) {
       //no watch for this example
    }
}

var config2 = {
    "name" : "comp-watch-test",
    "props": ['message'],
    "template": `Property Watch Test: <b> Change the message property of this component</b>`,
    "init" : function() {
        let prop1 = this.getProp('message') ? this.getAttribute('message') : "";
    },
    watch : function(attribute) {
        if (attribute.name == 'message') {
            attribute.comp.querySelector('b').innerHTML = ` - altered value, ${attribute.newValue} `;
        }
    }
}

var config3 = {
    "name" : "slot-test",
    "props": ['message'],
    "template": `Slot Test: <slot id="slot1"></slot>`,
    "shadow": true,
    "init" : function() {
       // let prop1 = this.getProp('message') ? this.getAttribute('message') : "";
       //this.slots();
    },
    watch : function(attribute) {
        if (attribute.name == 'message') {
            //attribute.comp.querySelector('b').innerHTML = ` - altered value, ${attribute.newValue} `;
        }
    }
}


Drow.register(config);
Drow.register(config2);
Drow.register(config3);