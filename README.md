# HiveSocial - A Social Media Platform for Hive Blockchain

This is a social media platform built on top of the Hive blockchain. It allows users to:
- Read posts from the Hive blockchain
- Create and publish posts
- Login using Hive Keychain or HiveSigner
- View user profiles and their posts
- Interact with posts (coming soon)

## Features

- Integration with Hive blockchain
- Authentication using Hive Keychain and HiveSigner
- Create and publish posts
- View trending posts
- User profiles
- Responsive design with Tailwind CSS

## Prerequisites

Before running this application, make sure you have:
- Node.js (v14 or higher)
- npm (v6 or higher)
- A Hive account
- Hive Keychain browser extension (recommended) or HiveSigner account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hivesocial
```

2. Install dependencies:
```bash
cd client
npm install
```

3. Create a `.env` file in the client directory and add your HiveSigner credentials (if using HiveSigner):
```
REACT_APP_HIVESIGNER_CLIENT_ID=your-client-id
REACT_APP_HIVESIGNER_REDIRECT_URI=http://localhost:3000/auth
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Usage

1. Install the Hive Keychain browser extension (recommended) or create a HiveSigner account
2. Login to the application using your Hive credentials
3. Browse trending posts on the home page
4. Create new posts using the "Create Post" button
5. View user profiles and their posts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Hive Blockchain
- Hive Keychain
- HiveSigner
- React.js
- Tailwind CSS 