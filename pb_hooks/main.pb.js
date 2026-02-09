/// <reference path="../pb_data/types.d.ts" />

// --- LIKES HOOKS ---

onRecordCreate((e) => {
    e.next(); // 1. 先執行建立動作

    const record = e.record;
    const promptId = record.get('prompt');
    const triggerUserId = record.get('user');

    try {
        const app = e.app || $app;
        const prompt = app.findRecordById("prompts", promptId);
        const recipientId = prompt.get("user");
        
        // 2. 更新按讚數
        prompt.set("likes_count", (prompt.getInt("likes_count") || 0) + 1);
        app.save(prompt);

        // 3. 發送通知 (如果不是自己按讚)
        if (triggerUserId !== recipientId) {
            const notifications = app.findCollectionByNameOrId("notifications");
            const notification = new Record(notifications, {
                recipient: recipientId,
                trigger_user: triggerUserId,
                prompt: promptId,
                type: "like",
                is_read: false
            });
            app.save(notification);
        }
    } catch (err) {
        console.log("[Like Create Error] " + err);
    }
}, "likes");

onRecordDelete((e) => {
    const record = e.record;
    const promptId = record.get('prompt');

    e.next(); // 1. 先執行刪除動作

    try {
        const app = e.app || $app;
        const prompt = app.findRecordById("prompts", promptId);
        
        // 2. 更新按讚數
        const current = prompt.getInt("likes_count");
        if (current > 0) {
            prompt.set("likes_count", current - 1);
            app.save(prompt);
        }
    } catch (err) {
        console.log("[Like Delete Error] " + err);
    }
}, "likes");


// --- COMMENTS HOOKS ---

onRecordCreate((e) => {
    e.next(); // 1. 先執行建立動作

    const record = e.record;
    const promptId = record.get('prompt');
    const triggerUserId = record.get('user');

    try {
        const app = e.app || $app;
        const prompt = app.findRecordById("prompts", promptId);
        const recipientId = prompt.get("user");

        // 2. 更新留言數
        prompt.set("comments_count", (prompt.getInt("comments_count") || 0) + 1);
        app.save(prompt);

        // 3. 發送通知 (如果不是自己留言)
        if (triggerUserId !== recipientId) {
            const notifications = app.findCollectionByNameOrId("notifications");
            const notification = new Record(notifications, {
                recipient: recipientId,
                trigger_user: triggerUserId,
                prompt: promptId,
                type: "comment",
                is_read: false
            });
            app.save(notification);
        }
    } catch (err) {
        console.log("[Comment Create Error] " + err);
    }
}, "comments");

onRecordDelete((e) => {
    const record = e.record;
    const promptId = record.get('prompt');

    e.next(); // 1. 先執行刪除動作

    try {
        const app = e.app || $app;
        const prompt = app.findRecordById("prompts", promptId);
        
        // 2. 更新留言數
        const current = prompt.getInt("comments_count");
        if (current > 0) {
            prompt.set("comments_count", current - 1);
            app.save(prompt);
        }
    } catch (err) {
        console.log("[Comment Delete Error] " + err);
    }
}, "comments");