-- CreateTable
CREATE TABLE "Bug" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jiraId" TEXT,
    "summary" TEXT NOT NULL,
    "overviewLoginCondition" TEXT,
    "overviewPlatform" TEXT,
    "overviewModule" TEXT,
    "overviewTrigger" TEXT,
    "overviewIssue" TEXT,
    "envPage" TEXT,
    "envPlatform" TEXT,
    "envOS" TEXT,
    "envBrowser" TEXT,
    "preconditions" TEXT,
    "stepsToReproduce" TEXT,
    "actualResult" TEXT,
    "expectedResult" TEXT,
    "userImpact" TEXT,
    "businessImpact" TEXT,
    "qaImpact" TEXT,
    "technicalNotes" TEXT,
    "environmentStage" TEXT NOT NULL DEFAULT 'dev',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignee" TEXT,
    "reporter" TEXT NOT NULL DEFAULT 'Anonymous',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'neutral',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BugLabel" (
    "bugId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    PRIMARY KEY ("bugId", "labelId"),
    CONSTRAINT "BugLabel_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BugLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BugEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bugId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'Anonymous',
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BugEvent_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BugComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bugId" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Anonymous',
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BugComment_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Bug_status_idx" ON "Bug"("status");

-- CreateIndex
CREATE INDEX "Bug_priority_idx" ON "Bug"("priority");

-- CreateIndex
CREATE INDEX "Bug_environmentStage_idx" ON "Bug"("environmentStage");

-- CreateIndex
CREATE INDEX "Bug_updatedAt_idx" ON "Bug"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Label_name_key" ON "Label"("name");

-- CreateIndex
CREATE INDEX "BugLabel_labelId_idx" ON "BugLabel"("labelId");

-- CreateIndex
CREATE INDEX "BugEvent_bugId_createdAt_idx" ON "BugEvent"("bugId", "createdAt");

-- CreateIndex
CREATE INDEX "BugEvent_createdAt_idx" ON "BugEvent"("createdAt");

-- CreateIndex
CREATE INDEX "BugComment_bugId_createdAt_idx" ON "BugComment"("bugId", "createdAt");

