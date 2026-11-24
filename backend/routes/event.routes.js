import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

import {
  registerForEvent,
  unregisterFromEvent,
  getEventParticipants,
  getMyRegistrations
} from "../controllers/event-registration.controller.js";

import {
  getPublishedEvents,
  createEvent,
  updateEvent,
  publishEvent,
  getEventById,
  getMyDrafts,
  getMyEvents,
  deleteEvent
} from "../controllers/event.controller.js";

import { uploadEventImage } from "../middleware/upload.middleware.js";

import {
  uploadEventImage as uploadEventImageController
} from "../controllers/event-image.controller.js";

import {
  setEventReaction,
  getEventReactionCounts,
  removeEventReaction
} from "../controllers/event-reaction.controller.js";

import {
  createEventComment,
  getEventComments
} from "../controllers/event-comment.controller.js";

const eventRouter = Router();

// Alle Veranstaltungsrouten erfordern ein gültiges JWT.
eventRouter.use(requireAuth);

eventRouter.get("/", getPublishedEvents);

eventRouter.get("/my-drafts", getMyDrafts);

eventRouter.get("/my-events", getMyEvents);

eventRouter.get("/my-registrations", getMyRegistrations);

eventRouter.get("/:id", getEventById);

eventRouter.post("/", createEvent);

eventRouter.post("/:id/register", registerForEvent);

eventRouter.delete("/:id/register", unregisterFromEvent);

eventRouter.get("/:id/participants", getEventParticipants);

eventRouter.post("/:id/reaction", setEventReaction);

eventRouter.get("/:id/reactions", getEventReactionCounts);

eventRouter.delete("/:id/reaction", removeEventReaction);

eventRouter.post("/:id/comments", createEventComment);

eventRouter.get("/:id/comments", getEventComments);

eventRouter.patch("/:id", updateEvent);

eventRouter.delete("/:id", deleteEvent);

eventRouter.patch("/:id/publish", publishEvent);

eventRouter.post(
  "/:id/image",
  uploadEventImage,
  uploadEventImageController
);

export default eventRouter;
