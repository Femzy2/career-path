# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Google authentication setup

This demo app includes Google sign‑in using [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/). A few notes to get it working:

1. In the code (`app/auth.tsx`) we build the redirect URI using:
   ```ts
   makeRedirectUri({ scheme: 'careerpath' })
   ```
   The value is logged to the console when the screen mounts so you can copy it.

2. Register that URI in the [Google Cloud Console → APIs & Services →
   Credentials](https://console.cloud.google.com/apis/credentials) for your
   OAuth 2.0 client. If you use Expo Go, the URI will be of the form
   `https://auth.expo.io/@your-username/your-slug` and `useProxy` is required;
   for a standalone build it will be `careerpath://redirect` (or similar).

3. Make sure `GOOGLE_WEB_CLIENT_ID` in `lib/firebase.ts` matches the
   *Web* client ID from the credentials screen – it’s used by `Google.useAuthRequest`.

After that you can sign in with Google from the auth screen; the ID token is
passed to Firebase via `AuthContext.googleSignIn`.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
