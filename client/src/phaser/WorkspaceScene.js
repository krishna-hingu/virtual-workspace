import Phaser from 'phaser';

export class WorkspaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorkspaceScene' });
  }

  preload() {
    // Load assets (avatars, office sprites, etc.)
    this.load.image('avatar', '/assets/avatar.png');
    this.load.image('office-bg', '/assets/office-bg.png');
    this.load.image('desk', '/assets/desk.png');
    this.load.image('chair', '/assets/chair.png');
    // Add more assets as needed
  }

  create() {
    // Create office background
    this.add.image(400, 300, 'office-bg');

    // Create player avatar
    this.player = this.physics.add.sprite(400, 300, 'avatar');
    this.player.setCollideWorldBounds(true);

    // Create desks and chairs
    this.desks = this.physics.add.staticGroup();
    this.desks.create(200, 200, 'desk');
    this.desks.create(600, 200, 'desk');
    // Add more desks

    this.chairs = this.physics.add.staticGroup();
    this.chairs.create(250, 250, 'chair');
    this.chairs.create(650, 250, 'chair');
    // Add more chairs

    // Add collisions
    this.physics.add.collider(this.player, this.desks);
    this.physics.add.collider(this.player, this.chairs);

    // Set up input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');

    // Initialize proximity system
    this.proximityRadius = 100;
    this.otherPlayers = []; // Array to hold other player sprites

    // Initialize UI systems
    this.initUI();
  }

  update() {
    // Handle player movement
    this.handleMovement();

    // Update proximity detection
    this.updateProximity();

    // Update UI elements
    this.updateUI();
  }

  handleMovement() {
    const isTyping = window.uiStore?.getState().isTyping; 
 
    if (isTyping) { 
      this.player.setVelocity(0, 0); 
      return; 
    } 

    const speed = 160;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
    }

    // Normalize diagonal movement
    if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
      this.player.setVelocity(
        this.player.body.velocity.x * 0.707,
        this.player.body.velocity.y * 0.707
      );
    }
  }

  updateProximity() {
    this.otherPlayers.forEach(otherPlayer => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        otherPlayer.x, otherPlayer.y
      );

      if (distance <= this.proximityRadius) {
        // Trigger proximity events
        this.events.emit('playerNearby', otherPlayer);
      }
    });
  }

  initUI() {
    // Initialize UI components that interact with Phaser
    // This would integrate with the UI systems from the HTML
  }

  updateUI() {
    // Update UI elements based on game state
    // This would update minimap, zone indicators, etc.
  }
}