/* =========================================================
   VORTEX SOCIAL APP
   app.js
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";


/* =========================================================
   VORTEX CORE
   ========================================================= */

const Vortex = {

    version: "1.0.0",

    state: {
        currentScreen: "home-screen",
        currentFeed: "top",
        currentUser: null,
        isAuthenticated: false,
        posts: [],
        stories: [],
        messages: [],
        savedPosts: [],
        searchResults: [],
        settingsOpen: false
    },

    config: {
        storageKey: "vortex_social_state",
        userKey: "vortex_social_user"
    }

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


/* =========================================================
   STORAGE
   ========================================================= */

const Storage = {

    load() {

        try {

            const saved =
                localStorage.getItem(Vortex.config.storageKey);

            if (!saved) return null;

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "VORTEX storage load failed:",
                error
            );

            return null;
        }
    },


    save() {

        try {

            localStorage.setItem(
                Vortex.config.storageKey,
                JSON.stringify({
                    posts: Vortex.state.posts,
                    stories: Vortex.state.stories,
                    messages: Vortex.state.messages,
                    savedPosts: Vortex.state.savedPosts,
                    currentFeed: Vortex.state.currentFeed
                })
            );

        } catch (error) {

            console.error(
                "VORTEX storage save failed:",
                error
            );
        }
    },


    saveUser(user) {

        try {

            localStorage.setItem(
                Vortex.config.userKey,
                JSON.stringify(user)
            );

        } catch (error) {

            console.error(
                "VORTEX user save failed:",
                error
            );
        }
    },


    loadUser() {

        try {

            const saved =
                localStorage.getItem(Vortex.config.userKey);

            return saved
                ? JSON.parse(saved)
                : null;

        } catch (error) {

            return null;
        }
    },


    clearUser() {

        localStorage.removeItem(
            Vortex.config.userKey
        );
    }

};


/* =========================================================
   DEMO DATA
   ========================================================= */

const DemoData = {

    posts: [

        {
            id: "post-001",
            author: "VORTEX World",
            username: "vortexworld",
            avatar: "V",
            text:
                "Welcome to VORTEX. Connect. Create. Discover. " +
                "This is the beginning of a new social universe.",
            likes: 128,
            comments: 24,
            shares: 12,
            saved: false,
            liked: false,
            createdAt: "Just now",
            category: "top"
        },

        {
            id: "post-002",
            author: "Brilliant Mere",
            username: "brilliant",
            avatar: "B",
            text:
                "Building ideas into reality. VORTEX is more " +
                "than an app — it is a universe.",
            likes: 94,
            comments: 18,
            shares: 7,
            saved: false,
            liked: false,
            createdAt: "2h",
            category: "new"
        },

        {
            id: "post-003",
            author: "VORTEX Creators",
            username: "creators",
            avatar: "C",
            text:
                "Create your content, build your audience, " +
                "and discover people from around the world.",
            likes: 76,
            comments: 11,
            shares: 5,
            saved: false,
            liked: false,
            createdAt: "5h",
            category: "best"
        }

    ],


    stories: [

        {
            id: "story-001",
            username: "vortexworld",
            name: "VORTEX",
            avatar: "V"
        },

        {
            id: "story-002",
            username: "brilliant",
            name: "Brilliant",
            avatar: "B"
        },

        {
            id: "story-003",
            username: "creators",
            name: "Creators",
            avatar: "C"
        }

    ],


    messages: [

        {
            id: "message-001",
            name: "VORTEX World",
            avatar: "V",
            text: "Welcome to VORTEX.",
            unread: true
        },

        {
            id: "message-002",
            name: "Creators",
            avatar: "C",
            text: "Let's create something amazing.",
            unread: false
        }

    ]

};


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initVortex() {

    console.log(
        `%cVORTEX ${Vortex.version}`,
        "color:#00d9ff;font-size:18px;font-weight:bold;"
    );

    loadApplicationState();

    initializeUser();

    bindNavigation();

    bindFeedTabs();

    bindTopBar();

    bindCreateActions();

    bindVaultActions();

    bindSettings();

    bindModal();

    bindSearch();

    render
