import 'phaser';
import WorkPlace from '../actors/work-place';
import Manager from '../actors/manager';
import HamburgerFactory from '../actors/hamburger-factory';
import EnergyDrinkFactory from '../actors/energy-drink-factory';
import CoffeeFactory from '../actors/coffee-factory';
import TaskFactory from '../actors/task-factory';
import Timer from '../actors/timer';

const {
    Text,
    Image,
    Container
} = Phaser.GameObjects;

const geoData = [
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],[10, 2], [11, 2], [12, 2], [13, 2], [14, 2],
    [0, 4], [1, 4], [4, 4], [5, 4], [9, 4], [10, 4], [13, 4], [14, 4],
    [0, 5], [1, 5], [13, 5], [14, 5],
    [0, 6], [1, 6], [13, 6], [14, 6],
    [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
    [0, 8], [1, 8], [13, 8], [14, 8],
    [0, 9], [1, 9], [2, 9], [3, 9], [11, 9], [12, 9], [13, 9], [14, 9],
    [0, 10], [1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
    [0, 11], [1, 11], [2, 11], [3, 11], [4, 11], [5, 11], [9, 11], [10, 11], [11, 11], [12, 11],[13, 11], [14, 11],
    [0, 12], [14, 12],
    [0, 13], [14, 13],
    [0, 14], [1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [9, 14], [10, 14], [11, 14], [12, 14],[13, 14], [14, 14],
    [0, 15], [1, 15], [2, 15], [3, 15], [4, 15], [5, 15], [9, 15], [10, 15], [11, 15], [12, 15],[13, 15], [14, 15],
    [0, 16], [1, 16], [2, 16], [3, 16], [4, 16], [5, 16], [6, 16], [7, 16], [8, 16], [9, 16], [10, 16], [11, 16], [12, 16],[13, 16], [14, 16],
];

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.view = new View(this);
        this.children.add(this.view);

        this.events.on('onSceneEvent', this.sceneEventHandler, this);

        this.wokers = 4;
    }

    sceneEventHandler(event, data) {
        switch (event) {
            case 'workerDead': {
                this.wokers--;

                if (!this.wokers) {
                    this.events.off('onSceneEvent', this.sceneEventHandler, this);

                    setTimeout(() => {
                        this.view.destroy();
                        this.view = null;

                        this.events.emit('onSceneEvent', 'gameFail');
                    }, 1000);
                }
                break;
            }

            default:
                console.warn('Game scene', 'Unknown event', event);
        }
    }

    update() {
        if (this.view) {
            this.view.update();
        }
    }
}

class View extends Container {
    constructor() {
        super(...arguments);

        const bg = new Image(this.scene, 0, 0, 'bg');
        bg.setOrigin(0);
        this.add(bg);

        const manager = this.manager = new Manager(this.scene, 300, 400);
        const hFactory = new HamburgerFactory(this.scene, 65, 125);
        const eFactory = new EnergyDrinkFactory(this.scene, 245, 125);
        const cFactory = new CoffeeFactory(this.scene, 425, 125);
        const tFactory = new TaskFactory(this.scene, 300, 650, this);

        this.shellContainer = new Phaser.GameObjects.Container(this.scene, 0, 640);

        this.add(manager.sprite);
        this.add(this.shellContainer);

        tFactory.tasks.forEach((task) => {
            this.add(task.sprite);
        });

	    this.add(tFactory.sprite);

        this.createWorkPlaces();

        this.scene.physics.add.collider(manager.sprite, hFactory.sprite, () => this.collideFactory(manager, hFactory));
        this.scene.physics.add.collider(manager.sprite, eFactory.sprite, () => this.collideFactory(manager, eFactory));
        this.scene.physics.add.collider(manager.sprite, cFactory.sprite, () => this.collideFactory(manager, cFactory));
        this.scene.physics.add.collider(manager.sprite, tFactory.sprite, () => this.collideFactory(manager, tFactory));

        let {map, layer} = this.addMapGeo(this.scene);

        layer.setCollision(0);
        this.scene.physics.add.collider(manager.sprite, layer);

        manager.sprite.body.setCollideWorldBounds(true);

        this.timer = new Timer({ticksInDay: 3000});
        this.dayText = this.scene.make.text('0 / 10');
        this.pointsText = this.scene.make.text('0 / 32');
        this.tasksText = this.scene.make.text('0 / 20');

        this.dayText.setPosition(110, 45);
        this.pointsText.setPosition(315, 45);
        this.tasksText.setPosition(515, 45);

        this.shellContainer.add([this.dayText, this.pointsText, this.tasksText]);
        this.tFactory = tFactory;

        const music = this.music = this.scene.sound.add('game');

        music.play('', {volume: 0.1, loop: -1});
    }

    destroy() {
        this.music.stop();

        super.destroy();
    }

    update() {
        if (this.emmited) {
            return;
        }

        if (this.tFactory.tasksFinished === 20) {
            this.scene.events.emit('onSceneEvent', 'gameSuccess');
            this.emmited = true;
            return;
        }

        if (this.timer.fullDays >= 10) {
            this.scene.events.emit('onSceneEvent', 'gameFail');
            this.emmited = true;
            return;
        }

        this.manager.update();
        this.list.forEach(item => {
            item.update();
        });
        this.timer.update();

        this.dayText.setText(`${this.timer.day} / 10`);
        this.pointsText.setText(`${this.tFactory.pointsFinished} / 32`);
        this.tasksText.setText(`${this.tFactory.tasksFinished} / 20`);

    }

    addMapGeo(scene) {
        let map = scene.make.tilemap({
            tileWidth: 40,
            tileHeight: 40,
            width: 600,
            height: 800
        });

        let tileset = map.addTilesetImage('transparent', null, 40, 40, 1, 1);
        let layer = map.createBlankDynamicLayer('Layer 1', tileset);

        geoData.forEach((tile) => {
            layer.putTileAt(0, tile[0], tile[1]);
        });

        layer.setActive(true);

        map.setLayer(layer);

        return {
            map,
            layer
        };
    }

    collideFactory(manager, factory) {
        let product = factory.produce(this.scene);

        if (product && !manager.pickup(manager, product)) {
            product.destroy();
        }
    }

    createWorkPlaces() {
        const scene = this.scene;
        const manager = this.manager;
        const configs = [
            {
                x: 100,
                y: 248,
                worker: {
                    x: 10,
                    y: -30,
                    spriteName: 'worker1',
                    width: 50,
                    height: 130,
                    characteristics: {
                        foodLossRate: 700,
                        energyLossRate: 400
                    }
                },

	            rip: {
                	x: 20,
		            y: -45
	            },

	            message: {
		            x: -46,
		            y: -128,
		            spriteName: 'message1',
		            text: {
			            x: 0,
			            y: -11
		            }
	            },

                table: {
                    spriteName: 'table1'
                }
            },
            {
                x: 500,
                y: 252,
                worker: {
                    x: 6,
                    y: -30,
                    spriteName: 'worker2',
                    width: 50,
                    height: 130,
                    characteristics: {
                        foodLossRate: 300,
                        energyLossRate: 600
                    }
                },

	            rip: {
		            x: 7,
		            y: -45
	            },

	            message: {
		            x: 54,
		            y: -130,
		            spriteName: 'message2',
		            text: {
			            x: 2,
			            y: -11
		            }
	            },

                table: {
                    spriteName: 'table2'
                }
            },
            {
                x: 100,
                y: 420,
                worker: {
                    x: 10,
                    y: -20,
                    spriteName: 'worker3',
                    width: 50,
                    height: 110,
                    characteristics: {
                        foodLossRate: 500,
                        energyLossRate: 800
                    }
                },

	            rip: {
		            x: 20,
		            y: -45
	            },

	            message: {
		            x: -42,
		            y: -110,
		            spriteName: 'message1',
		            text: {
			            x: 0,
			            y: -11
		            }
	            },

                table: {
                    spriteName: 'table3'
                }
            },
            {
                x: 500,
                y: 416,
                worker: {
                    y: -30,
                    spriteName: 'worker4',
                    width: 50,
                    height: 130,
                    characteristics: {
                        foodLossRate: 900,
                        energyLossRate: 200
                    }
                },

	            rip: {
		            x: 7,
		            y: -45
	            },

                message: {
                    x: 55,
                    y: -128,
	                spriteName: 'message2',
                    text: {
                        x: 2,
                        y: -11
                    }
                },

                table: {
                    spriteName: 'table4'
                }
            }
        ];

        configs.forEach((config) => {
            config.y += 90;

            const workPlace = new WorkPlace(scene, config);

            this.add(workPlace);

            scene.physics.add.collider(manager.sprite, workPlace.table, () => {
                manager.interact(manager, workPlace);
            });
        });
    }
}
