# Vercel Web Deployment Guide

This guide outlines the process for deploying the web version of the Teferenth Expo application to Vercel. Vercel offers a streamlined deployment experience for Expo web projects.

## Prerequisites

1.  **Project Pushed to GitHub**: Ensure your project code, including all recent changes, is pushed to a GitHub repository.
2.  **Vercel Account**: You will need a Vercel account. You can sign up for free at [vercel.com](https://vercel.com).

## Deployment Steps

Vercel's integration with GitHub makes the deployment process straightforward.

1.  **Log in to Vercel**:
    *   Go to your Vercel dashboard.

2.  **Import Project**:
    *   Click on "Add New..." and select "Project".
    *   You will be prompted to connect to a Git provider. Choose "Continue with GitHub".
    *   Authorize Vercel to access your GitHub repositories if you haven't already.
    *   Select the GitHub repository for the Teferenth Expo application from the list. You might need to install the Vercel GitHub App on your repository or organization if prompted.

3.  **Configure Project (Automatic)**:
    *   Vercel is designed to automatically detect Expo web projects.
    *   It should correctly identify the framework preset as "Expo (React Native for Web)".
    *   **Build Command**: Vercel will typically auto-populate the build command. For Expo web projects, this should be `npx expo export:web` or a similar command that generates the static web output. Verify this is correctly set. If not, you can override it.
    *   **Output Directory**: Vercel should also correctly detect the output directory, which is usually `dist` or `web-build` for `expo export:web`. Verify this.
    *   **Environment Variables**: If your web application requires specific environment variables for the build process or at runtime (that are not secrets), you can configure them in the "Environment Variables" section of the project settings on Vercel. For secrets, use Vercel's UI to add them securely. Note that environment variables defined in `.env` files locally are typically not committed to Git and will need to be set in Vercel.

4.  **Deploy**:
    *   Click the "Deploy" button.
    *   Vercel will start the build process, fetching your code, installing dependencies, running the build command, and deploying the output.
    *   You can monitor the build logs in real-time on the Vercel dashboard.

5.  **Access Your Deployed Site**:
    *   Once the deployment is complete, Vercel will provide you with a unique URL (e.g., `your-project-name.vercel.app`) where your web application is live.
    *   Vercel also automatically sets up a custom domain for each deployment, which is useful for previewing changes.

## Continuous Deployment (CI/CD)

By default, Vercel sets up automatic deployments:

*   **Production Branch**: Every push to your main branch (commonly `main` or `master`) will trigger a new production deployment.
*   **Preview Deployments**: Every push to other branches or pull requests will generate a unique preview deployment. This is extremely useful for testing changes before merging them into the main branch.

## Custom Domains

Once you are ready, you can configure a custom domain (e.g., `app.teferenth.com`) for your Vercel project through the Vercel dashboard settings.

## Important Considerations

*   **`package.json` Scripts**: Ensure your `package.json` has the necessary build script that Vercel will use. The standard command for Expo web is `npx expo export:web`. If you have a custom script (e.g., `npm run build:web`), ensure Vercel is configured to use that.
*   **Base Path**: If your application is not served from the root of the domain (e.g., `yourdomain.com/app/`), you might need to configure the base path in your Expo app configuration and potentially in Vercel.
*   **Environment Variables in EAS vs. Vercel**: Remember that environment variables managed via `eas secret:create` are for EAS Build and EAS Update, not for Vercel web deployments. Web deployment environment variables must be configured directly in Vercel project settings.

This setup provides a robust and automated CI/CD pipeline for the web version of the Teferenth Expo application. Refer to the [official Vercel documentation](https://vercel.com/docs) for more advanced configurations and troubleshooting.
