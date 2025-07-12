# Aethermind Firebase Firestore Schema

This document outlines the data structure used in Firestore to store user conversations for the Aethermind application.

## Data Model

The database uses three top-level collections: `workspaces`, `chats`, and `users`.

### 1. `workspaces` Collection

This collection stores user-created workspaces for organizing chats.

-   **Path**: `/workspaces/{workspaceId}`

**Document Fields**:

| Field       | Type        | Description                                                         |
|-------------|-------------|---------------------------------------------------------------------|
| `name`      | `string`    | The user-defined name of the workspace.                             |
| `icon`      | `string`    | The name of the `lucide-react` icon for the workspace.              |
| `color`     | `string`    | A hex color code for the workspace icon and accents.                |
| `ownerId`   | `string`    | The UID of the user who created the workspace.                      |
| `members`   | `array`     | An array of user UIDs who have access to this workspace.            |
| `createdAt` | `Timestamp` | The timestamp when the workspace was created.                       |


### 2. `chats` Collection

This is the main collection where all chat sessions are stored.

-   **Path**: `/chats/{chatId}`

**Document Fields**:

| Field       | Type        | Description                                                                 |
|-------------|-------------|-----------------------------------------------------------------------------|
| `workspaceId`| `string`   | (Optional) The ID of the workspace this chat belongs to. Null if unassigned. |
| `ownerId`   | `string`    | The UID of the user who created the chat. Used for ownership/analytics.     |
| `members`   | `array`     | An array of user UIDs who are part of this chat. Used for security rules.   |
| `title`     | `string`    | The title of the chat, usually generated from the first user prompt.        |
| `createdAt` | `Timestamp` | The timestamp when the chat was first created.                              |
| `updatedAt` | `Timestamp` | The timestamp of the last message in the chat. Used for sorting chat history.|
| `isStarred` | `boolean`   | (Optional) `true` if the user has starred/saved this chat. Defaults to `false`. |
| `defaultModelId` | `string` | (Optional) The default model/persona for this chat session.                 |

### 3. `messages` Subcollection

Each document in the `chats` collection has a subcollection named `messages` which stores all the individual messages for that chat.

-   **Path**: `/chats/{chatId}/messages/{messageId}`

**Document Fields**:

| Field        | Type        | Description                                                                    |
|--------------|-------------|--------------------------------------------------------------------------------|
| `ownerId`    | `string`    | The UID of the chat's owner. Denormalized for collection group queries.        |
| `author`     | `object`    | An object containing information about the message sender.                     |
| `author.uid` | `string`    | The UID of the user who sent the message.                                      |
| `author.name`| `string`    | The display name of the user who sent the message.                             |
| `author.avatar`| `string`| (Optional) The photo URL of the user who sent the message.                     |
| `role`       | `string`    | Either 'user' or 'assistant'.                                                  |
| `content`    | `string`    | The text content of the message.                                               |
| `createdAt`  | `Timestamp` | The timestamp when the message was created.                                    |
| `responses`  | `array`     | (Optional) For 'assistant' roles, an array of objects from different models.   |
| `isSummary`  | `boolean`   | (Optional) `true` if the message is a Smart AI summary.                        |
| `isCopilotResponse`| `boolean`   | (Optional) `true` if the message is from the AI Co-pilot.              |
| `isPersonaResponse` | `boolean` | (Optional) `true` if the message is from the AIHub Persona.              |
| `detectedLanguage` | `string`| (Optional) The detected language of the user's prompt, if translated.      |
| `personaName`| `string`    | (Optional) The name of the persona that generated the response.                |


### 4. `users` Collection

This collection stores user-specific data that is not part of Firebase Auth, such as preferences and gamification stats.

-   **Path**: `/users/{userId}`

**Document Fields**:

| Field         | Type      | Description                                                    |
|---------------|-----------|----------------------------------------------------------------|
| `email`       | `string`  | The user's email address.                                      |
| `pushToken`   | `string`  | (Optional) The user's Firebase Cloud Messaging token.          |
| `notifications` | `object`  | (Optional) User's notification preferences.                  |
| `notifications.email` | `boolean` | Enable/disable email notifications.                      |
| `notifications.push` | `boolean` | Enable/disable push notifications.                       |
| `notifications.weeklySummary` | `boolean` | Enable/disable weekly summary emails.                |
| `xp` | `number` | The user's total experience points. |
| `level` | `number` | The user's current level. |
| `title` | `string` | The user's displayable title (e.g., "Code Ninja"). |
| `currentStreak`| `number`| The user's current daily usage streak. |
| `longestStreak`| `number`| The user's longest ever daily usage streak. |
| `lastStreakUpdate`| `Timestamp` | The timestamp of the last streak update to prevent multiple updates per day. |
| `badges` | `array` | An array of strings representing earned badge IDs (e.g., ["7_DAY_STREAK", "POWER_USER"]). |


---

## Firestore Security Rules

To ensure that users can only access their own data, you must update your Firestore security rules.

**Instructions**:

1.  Go to your **Firebase project** in the Firebase Console.
2.  In the left-hand menu, go to **Build > Firestore Database**.
3.  Click on the **Rules** tab at the top.
4.  Replace the default rules with the following code:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
  
    // WORKSPACES
    // Users can:
    // 1. Create a workspace if they are the owner.
    // 2. Read, update, or delete workspaces they are a member of.
    match /workspaces/{workspaceId} {
      allow read, update, delete: if request.auth != null && 
                                   'members' in resource.data && 
                                   resource.data.members is list &&
                                   request.auth.uid in resource.data.members;

      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.ownerId;
    }

    // CHATS
    // Users can:
    // 1. Create a chat if they are the owner and a member of the target workspace.
    // 2. Read/delete chats they are a member of (or own).
    // 3. Update chats (e.g., title, members) securely.
    match /chats/{chatId} {
      // Allow reading if user is owner OR a member.
      // This supports queries by ownerId and by members.
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.ownerId ||
                      ('members' in resource.data && resource.data.members is list && request.auth.uid in resource.data.members));
                      
      allow delete: if request.auth != null && 
                       'members' in resource.data &&
                       resource.data.members is list && 
                       request.auth.uid in resource.data.members;

      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.ownerId &&
                       (request.resource.data.workspaceId == null ||
                        (
                          exists(/databases/$(database)/documents/workspaces/$(request.resource.data.workspaceId)) &&
                          request.auth.uid in get(/databases/$(database)/documents/workspaces/$(request.resource.data.workspaceId)).data.members
                        )
                       );

      // This rule allows a user to update a chat IF:
      // 1. They will be a member after the update is complete.
      // 2. They are not removing any other members from the chat.
      // This securely handles both joining a chat and updating its title.
      allow update: if request.auth != null &&
                       'members' in resource.data &&
                       resource.data.members is list &&
                       request.auth.uid in request.resource.data.members &&
                       request.resource.data.members.hasAll(resource.data.members);

      // MESSAGES (Direct access by path for members)
      // This allows members of a chat to read, create, update, and delete messages in that chat.
      match /messages/{messageId} {
        allow read, create, update, delete: if request.auth != null && 
                                     'members' in get(/databases/$(database)/documents/chats/$(chatId)).data &&
                                     get(/databases/$(database)/documents/chats/$(chatId)).data.members is list &&
                                     request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
      }
    }
    
    // MESSAGES (Collection Group access for dashboard)
    // This allows the dashboard query to read all messages belonging to a user.
    // This rule is combined with the one above. A read is allowed if either rule passes.
    match /{path=**}/messages/{messageId} {
      // Users can only read messages from chats they own for analytics purposes.
      allow read: if request.auth != null && 
                   'ownerId' in resource.data && 
                   request.auth.uid == resource.data.ownerId;

      // Allow updates for reactions from any member of the chat.
      allow update: if request.auth != null &&
                     exists(/databases/$(database)/documents/chats/$(path[0])) &&
                     request.auth.uid in get(/databases/$(database)/documents/chats/$(path[0])).data.members;

      // Disallow any other writes through this general collection group rule for security.
      allow create, delete: if false;
    }
    
    // USERS
    // Users can get, create, and update their own preferences document.
    // The document ID must match their authentication UID.
    match /users/{userId} {
        allow get, create, update: if request.auth != null && request.auth.uid == userId;
        // Disallow listing all users or deleting a profile for security.
        allow list, delete: if false;
    }
  }
}
```

5.  Click **Publish**.

---

## Firestore Indexes

For certain queries to work, Firestore requires specific indexes. **Without these, parts of the app may fail with permission errors or fail to start.**

### Required Index: Dashboard & Analytics

This index is crucial for the charts and stats on your Dashboard page.

-   **Collection ID**: `messages`
-   **Fields to index**:
    -   `ownerId` (Ascending)
    -   `createdAt` (Descending)
-   **Query scope**: Collection Group

### Required Index: Secure Chat Cleanup

This index is required for the system to efficiently find and delete chats that have passed their self-destruct timer.

-   **Collection ID**: `chats`
-   **Fields to index**:
    -   `ownerId` (Ascending)
    -   `expiresAt` (Ascending)
-   **Query scope**: Collection Group

Your database is now configured and secure for the Xora application!
