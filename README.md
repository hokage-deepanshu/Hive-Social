# HiveSocial - A Hive Blockchain Social Media Application

A modern social media application built on the Hive blockchain, allowing users to create posts, comment, vote, and interact with the Hive ecosystem.

## Features

- **Authentication**: Login with Hive Keychain or direct private key
- **Content Creation**: Create and publish posts to the Hive blockchain
- **Social Interactions**: Vote on posts, comment, and view user profiles
- **Media Support**: Upload and embed images in posts
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: React, React Router, Tailwind CSS
- **Blockchain**: Hive Blockchain, dhive library
- **Authentication**: Hive Keychain, direct key signing
- **State Management**: React Context API
- **Styling**: Tailwind CSS for responsive design

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hive-social-app.git
   cd hive-social-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Authentication

- **Hive Keychain**: Install the [Hive Keychain browser extension](https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep) for the most secure experience
- **Direct Key**: You can also use your private posting key directly (less secure but doesn't require extensions)

### Creating Posts

1. Click "Create Post" in the navigation bar
2. Enter a title, content, and tags
3. Optionally upload images
4. Click "Publish Post" or "Simple Post" to publish to the Hive blockchain

### Interacting with Content

- **Voting**: Click the upvote button on posts
- **Commenting**: Add comments to posts
- **Profiles**: View user profiles by clicking on usernames

## Project Structure

```
client/
├── public/             # Static files
├── src/
│   ├── components/     # React components
│   ├── utils/          # Utility functions
│   ├── hooks/          # Custom React hooks
│   ├── App.js          # Main application component
│   └── index.js        # Application entry point
└── package.json        # Dependencies and scripts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Hive Blockchain](https://hive.io/) for the decentralized content platform
- [dhive](https://github.com/openhive-network/dhive) for the JavaScript Hive client
- [Hive Keychain](https://github.com/hive-keychain/hive-keychain-extension) for secure authentication 