import "./styles.css";
import Drow from "./drow";

document.getElementById("app").innerHTML = `
<h1>Hello DrowJS!</h1>
<div>
  We use Parcel to bundle this sandbox, you can find more info about Parcel
  <a href="https://parceljs.org" target="_blank" rel="noopener noreferrer">here</a>.
</div>
`;

var config = {
  name: "my-custom",
  props: ["message"],
  template: `<div>Hello <b> Universe</b></div>`,
  init: function() {
    //let message = this.getProp("message") ? this.getAttribute("message") : "";

    this.getComp().addEventListener("click", e => {
      this.getComp().querySelector("b").innerHTML =
        " DOM - Clicked: " + new Date();
    });
  },
  watch: function(attribute) {
    if (attribute.name === "message") {
      attribute.comp.querySelector("b").innerHTML = ` - altered value, ${
        attribute.newValue
      }`;
    }
  }
};
//Drow.register(config);
