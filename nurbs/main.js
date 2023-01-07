import { CGFapplication, CGFinterface } from '../lib/CGF.js';
import { NurbsScene } from './NurbsScene.js';

function main() {

    var app = new CGFapplication(document.body);
    var myScene = new NurbsScene();
    var myInterface = new CGFinterface();

    app.init();

    app.setScene(myScene);
    app.setInterface(myInterface);

    myInterface.setActiveCamera(myScene.camera);

	app.run();
}

main();