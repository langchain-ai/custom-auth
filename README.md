# Supabase Auth for LangGraph

[![Open in - LangGraph Studio](https://img.shields.io/badge/Open_in-LangGraph_Studio-00324d.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4NS4zMzMiIGhlaWdodD0iODUuMzMzIiB2ZXJzaW9uPSIxLjAiIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTEzIDcuOGMtNi4zIDMuMS03LjEgNi4zLTYuOCAyNS43LjQgMjQuNi4zIDI0LjUgMjUuOSAyNC41QzU3LjUgNTggNTggNTcuNSA1OCAzMi4zIDU4IDcuMyA1Ni43IDYgMzIgNmMtMTIuOCAwLTE2LjEuMy0xOSAxLjhtMzcuNiAxNi42YzIuOCAyLjggMy40IDQuMiAzLjQgNy42cy0uNiA0LjgtMy40IDcuNkw0Ny4yIDQzSDE2LjhsLTMuNC0zLjRjLTQuOC00LjgtNC44LTEwLjQgMC0xNS4ybDMuNC0zLjRoMzAuNHoiLz48cGF0aCBkPSJNMTguOSAyNS42Yy0xLjEgMS4zLTEgMS43LjQgMi41LjkuNiAxLjcgMS44IDEuNyAyLjcgMCAxIC43IDIuOCAxLjYgNC4xIDEuNCAxLjkgMS40IDIuNS4zIDMuMi0xIC42LS42LjkgMS40LjkgMS41IDAgMi43LS41IDIuNy0xIDAtLjYgMS4xLS44IDIuNi0uNGwyLjYuNy0xLjgtMi45Yy01LjktOS4zLTkuNC0xMi4zLTExLjUtOS44TTM5IDI2YzAgMS4xLS45IDIuNS0yIDMuMi0yLjQgMS41LTIuNiAzLjQtLjUgNC4yLjguMyAyIDEuNyAyLjUgMy4xLjYgMS41IDEuNCAyLjMgMiAyIDEuNS0uOSAxLjItMy41LS40LTMuNS0yLjEgMC0yLjgtMi44LS44LTMuMyAxLjYtLjQgMS42LS41IDAtLjYtMS4xLS4xLTEuNS0uNi0xLjItMS42LjctMS43IDMuMy0yLjEgMy41LS41LjEuNS4yIDEuNi4zIDIuMiAwIC43LjkgMS40IDEuOSAxLjYgMi4xLjQgMi4zLTIuMy4yLTMuMi0uOC0uMy0yLTEuNy0yLjUtMy4xLTEuMS0zLTMtMy4zLTMtLjUiLz48L3N2Zz4=)](https://langgraph-studio.vercel.app/templates/open?githubUrl=https://github.com/langchain-ai/custom-auth)

This template implements access control in a LangGraph deployment using OAuth2 with Google, managing user information in Supabase. It combines a LangGraph backend with a React frontend to create a secure chatbot where users can only access their own conversation threads.

## Architecture

The application consists of two main components:

1. **Backend**: A LangGraph Cloud deployment running a chatbot with custom [authentication middleware](src/security/auth.py)
2. **Frontend**: A React application using Supabase Auth for user management

![Authentication Flow](./static/studio_ui.png)

There are two levels of checks in this template:
- **Authentication**: Verifies the identity of users (via Supabase JWT)
- **Authorization**: Controls what resources each user can access (threads, runs, etc.)

We present the end-to-end flow in more detail in [Authentication Flow](#authentication-flow) and [Authorization Flow](#authorization-flow) below.

## Getting Started

We will use Supabase for authentication and enable a "Sign in with Google" button for users to sign in to your deployment. To get started, follow these steps (largely adapted from [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=web&queryGroups=environment&environment=client#configure-your-services-id)):

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project's URL, Service Key, and JWT secret from the project settings > API screen into your `.env` file. This will let your LangGraph backend connect to your Supabase project.

```bash
cp .env.example .env
```

and set the following environment variables:
```bash
SUPABASE_URL=https://abcd123456789.supabase.co
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
```
3. Copy your project's public Anon key and URL from the same screen into the .env file of the frontend folder. This will let your React frontend connect to your Supabase project.

```bash
cd app/supabase-react
```

```bash
REACT_APP_SUPABASE_URL=https://ynlkmijkhkvwcqnuillj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=CHANGEME
```

4. Enable google authentication by going to Authentication > Providers in your Supabase dashboard. Copy your `Callback URL (for OAuth)` to use for the next step. Leave this tab open for step 3.

### 2. Configure Google OAuth

To enable "Sign in with Google", follow these steps:

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the Google OAuth2 API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Name: Your app name
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Your production frontend URL (We will update this later)
   - Authorized redirect URIs:
     - `https://<YOUR_DOMAIN>.supabase.co/auth/v1/callback` (copied from the previous step)
4. Save your Client ID and Client Secret

Now, switch back to the Supabase dashboard from step 1 above (in Authentication > Providers > Google) and:
5. Paste your Google Client ID and Client Secret from step 2 in the Google OAuth credentials

### 3. Run locally

1. Start the LangGraph backend:

Add an API key for your LLM provider (by default, ANTHROPIC_API_KEY) to your `.env` file, and then
run the local backend server:

```bash
pip install -U "langgraph-cli[inmem]" && pip install -e .
langgraph dev
```

Or as a one liner (if you've [installed uv](https://docs.astral.sh/uv/getting-started/installation/)):

```bash
uvx  --from "langgraph-cli[inmem]" --with-editable . --python 3.11 langgraph dev
```

2. Next, start the frontend:

```bash
cd app/supabase-react
npm run start
```

If you've completed the steps above, you will see a "Sign in with Google" button on the home page. Once you log in, you can chat with the LangGraph backend. If you sign in with a different account, you will only be able to see your own conversation threads.

### 4. Deployment

Once you've gotten the server working locally, you can proceed to deployment. 

1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```
2. Deploy the LangGraph backend by signing in at [smith.langchain.com](https://smith.langchain.com/) going to the "LangGraph Platform" page. Once you've connected your GitHub repository, you can deploy your repository to LangGraph. Copy the environment variables from your `.env` file in to the appropriate form.

Once the deployment is complete, copy the LangGraph deployment URL. We will use this as the the `REACT_APP_DEPLOYMENT_URL` variable when deploying the frontend.

3. Deploy the frontend (e.g., on Vercel). Sign in at [vercel.com](https://vercel.com/) and connect your GitHub repository. Copy the environment variables from your `app/supabase-react/.env` file, making sure to include the `REACT_APP_DEPLOYMENT_URL` variable. Then deploy the frontend.

Once the deployment is complete, copy the frontend URL and add it to the list of "Authorized JavaScript origins" in your Google OAuth credentials (from step 2 above).

Additionally, you must add your frontend URL to the list of "Authorized redirect URIs" in your Supabase dashboard (from step 1 above). This can be found in the "Authentication > URL Configuration" section. 

Once you've completed the steps above, you should be good to go!

## Authentication Flow

This template implements JWT Bearer token authentication:

1. User navigates to the your frontend application
2. Browser checks authentication state via the Supabase Auth Provider checks authentication state
3. If not authenticated, user is signs in via:
   - OAuth2 with Google
   - Email/password authentication
4. This sends a request to Supabase's authentication service:
   - Creates a JWT containing user claims
   - Signs it with your Supabase JWT secret
   - Returns only the signed token to frontend
5. Frontend then attaches the signed JWT as Bearer token to API requests to the LangGraph backend
6. LangGraph backend then calls your authentication middleware ([`auth.py`](src/security/auth.py)):
   - Verifies JWT signature
   - Validates claims against Supabase Auth service using the project secret key

The secret key (`SUPABASE_JWT_SECRET`) is only known to:

- Supabase's authentication servers
- Your LangGraph backend

## Authorization Flow

After a user is authenticated, the backend enforces per-user resource isolation using the `add_owner` handler in `auth.py`.
This handler does two things:

1. For resource creation or modification, it adds the authenticated user's identity as the `owner` in that resource's metadata. This ensures that we can filter resources based on user identity.
2. It returns a filter dictionary that enforces access control on all operations (create, read, update, delete) on the resource, so only the owner can access it.

This means that even if a user has a valid JWT tokena and obtains another user's thread ID, they cannot:

- View the thread's messages
- Add messages to the thread
- Delete or modify the thread

The authorization is enforced at the database level, not just in the UI, making it impossible to write scripts that bypass authorization.

## Implementation Details

### Backend Authentication (`src/security/auth.py`)

The backend implements custom authentication middleware that:

1. Validates JWT tokens against Supabase
2. Associates user identity with resources
3. Enforces access control on all operations (create, read, update, delete)

Key components:

- `get_current_user`: Validates JWT tokens and authenticates users
- `add_owner`: Adds user identity to resource metadata
- Resource filtering ensures users can only access their own data

### Frontend Integration

The React frontend (`app/supabase-react`) handles:

- User authentication state management
- JWT token management
- Secure API calls to the LangGraph backend

## Customization

1. **Auth Providers**: Configure additional OAuth providers in Supabase
2. **Access Control**: Modify `add_owner` to implement custom access control logic
3. **Resource Sharing**: Extend the model to support shared resources between users

## Next Steps

For more advanced features and examples, refer to:

- [LangGraph Documentation](https://github.com/langchain-ai/langgraph)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

LangGraph Studio integrates with [LangSmith](https://smith.langchain.com/) for debugging and monitoring your authenticated deployment.

<!--
Configuration auto-generated by `langgraph template lock`. DO NOT EDIT MANUALLY.
{
  "config_schemas": {
    "agent": {
      "type": "object",
      "properties": {}
    }
  }
}
-->
