
import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

import "./App.css";

const initialEmail = {
  subject: "Application for Java Spring Boot Developer Internship",
  body: `Dear Hiring Manager,

I hope you are doing well.

I am writing to express my interest in the Java Spring Boot Developer Internship. I have been developing my skills in Java, Spring Boot, REST APIs, and SQL, and I am eager to apply my knowledge to real-world projects.

I would appreciate the opportunity to discuss how my skills and enthusiasm could contribute to your team.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
Your Name`,
};

function App() {
  const [mode, setMode] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState("English");
  const [subject, setSubject] = useState(initialEmail.subject);
  const [emailBody, setEmailBody] = useState(initialEmail.body);
  const [generated, setGenerated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const [selectedModel, setSelectedModel] = useState("gemini");

  const handleGenerate = async () => {
    if (mode === "generate" && !prompt.trim()) {
      setNotice("Please describe the email you want to write.");
      return;
    }

    if (mode === "reply" && !originalEmail.trim()) {
      setNotice("Please paste the email you want to reply to.");
      return;
    }

    setNotice("");
    setLoading(true);
    setGenerated(false);

    try {
      const emailContent = mode === "generate" ? prompt.trim() : originalEmail.trim();

      const response = await fetch("https://mailmuse-backend.onrender.com/api/email/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain",
        },
        body: JSON.stringify({
          emailContent,
          prompt: mode === "generate" ? prompt.trim() : "",
          originalEmail: mode === "reply" ? originalEmail.trim() : "",
          tone,
          length,
          language,
          mode,
          provider: selectedModel,
          model: selectedModel,
        }),
      });

      const responseText = await response.text();
      let data = responseText;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          // Some older backend versions may return plain text.
        }
      }

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" && data !== null
            ? data.message || data.error || data.details
            : data;
        throw new Error(
          errorMessage || `Request failed with status ${response.status}`
        );
      }

      // The updated backend returns { subject, body }.
      // Keep fallbacks for compatibility with the older response formats.
      let generatedSubject =
        typeof data === "object" && data !== null
          ? data.subject ?? data.emailSubject ?? ""
          : "";

      let generatedBody =
        typeof data === "string"
          ? data
          : data?.body ??
            data?.emailBody ??
            data?.content ??
            data?.generatedEmail ??
            data?.response ??
            data?.text ??
            data?.result;

      if (typeof generatedBody !== "string" || !generatedBody.trim()) {
        throw new Error(
          "The backend responded, but no email body was found. Check the API response format."
        );
      }

      let cleanedBody = generatedBody.trim();

      // Handle older responses that wrap the email JSON in a string.
      if (!generatedSubject && cleanedBody.startsWith("{")) {
        try {
          const parsedBody = JSON.parse(cleanedBody);
          if (typeof parsedBody.subject === "string") {
            generatedSubject = parsedBody.subject.trim();
          }
          if (typeof parsedBody.body === "string") {
            cleanedBody = parsedBody.body.trim();
          }
        } catch {
          // It was plain email text, not JSON.
        }
      }

      // Backward compatibility: extract a Subject: line if an older API
      // returned the subject and body together as plain text.
      cleanedBody = cleanedBody.replace(/^response\s*:\s*/i, "");
      const subjectMatch = cleanedBody.match(/^Subject\s*:\s*(.+?)(?:\r?\n|$)/i);

      if (!generatedSubject && subjectMatch) {
        generatedSubject = subjectMatch[1].trim();
      }

      if (subjectMatch) {
        cleanedBody = cleanedBody.slice(subjectMatch[0].length).trimStart();
      }

      // Remove common Markdown wrappers/formatting from older AI responses.
      cleanedBody = cleanedBody
        .replace(/^```(?:text|markdown)?\s*/i, "")
        .replace(/\s*```$/, "")
        .replace(/^\s*(?:\*{3,}|-{3,}|_{3,})\s*$/gm, "")
        .replace(/^\s*\*\*(Subject|Email Body|Body):\*\*\s*/gim, "")
        .trim();

      if (!cleanedBody) {
        throw new Error("The AI returned an empty email body. Please try again.");
      }

      setSubject(
        generatedSubject ||
          (mode === "reply" ? "Re: Your email" : "Generated email")
      );
      setEmailBody(cleanedBody);
      setGenerated(true);
      setNotice(
        `Email generated successfully using ${
          selectedModel === "gemini"
            ? "Gemini"
            : "NVIDIA Nemotron via OpenRouter"
        }.`
      );
    } catch (error) {
      console.error("Email generation failed:", error);
      setNotice(
        error instanceof TypeError
          ? "Could not connect to the backend. Make sure Spring Boot is running on https://mailmuse-backend.onrender.com and CORS allows this frontend."
          : error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Subject: ${subject}\n\n${emailBody}`
      );
      setCopied(true);
      setNotice("Email copied to clipboard.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Clipboard access failed. Select and copy the email manually.");
    }
  };

  const startNew = () => {
    setPrompt("");
    setOriginalEmail("");
    setSubject("");
    setEmailBody("");
    setGenerated(false);
    setNotice("");
  };

  return (
    <Box className="app-shell">
      <Box component="aside" className="sidebar">
        <Box className="brand">
          <Box className="brand-icon">
            <AutoAwesomeRoundedIcon />
          </Box>
          <Typography variant="h6" className="brand-name">
            Mailuse
          </Typography>
        </Box>

        <Typography className="nav-label">WORKSPACE</Typography>

        <Button
          className={`nav-item ${mode === "generate" ? "active" : ""}`}
          startIcon={<DashboardRoundedIcon />}
          onClick={() => {
            setMode("generate");
            setNotice("");
          }}
          fullWidth
        >
          Generate email
        </Button>

        <Button
          className={`nav-item ${mode === "reply" ? "active" : ""}`}
          startIcon={<ReplyRoundedIcon />}
          onClick={() => {
            setMode("reply");
            setNotice("");
          }}
          fullWidth
        >
          Reply to email
        </Button>

        <Button
          className="nav-item"
          startIcon={<DraftsRoundedIcon />}
          onClick={() => setNotice("Saved drafts will appear here when draft storage is added.")}
          fullWidth
        >
          My drafts
        </Button>

        <Box className="sidebar-bottom">
          <Divider />
          <Button
            className="nav-item"
            startIcon={<SettingsRoundedIcon />}
            onClick={() => setNotice("Settings will be available soon.")}
            fullWidth
          >
            Settings
          </Button>
          <Box className="profile">
            <Avatar className="profile-avatar">Y</Avatar>
            <Box>
              <Typography className="profile-name">Your Workspace</Typography>
              <Typography className="profile-subtitle">
                Free plan
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="main" className="main-content">
        <AppBar position="static" elevation={0} className="topbar">
          <Toolbar className="topbar-inner">
            <Box>
              <Typography className="breadcrumb">
                Workspace / {mode === "generate" ? "Generate email" : "Reply to email"}
              </Typography>
            </Box>
            <Box className="topbar-right">
              <Chip
                icon={<AutoAwesomeRoundedIcon />}
                label="AI writing assistant"
                className="ai-chip"
              />
              <Avatar className="top-avatar">Y</Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Box className="page-content">
          <Box className="page-heading">
            <Box>
              <Typography variant="h4" className="page-title">
                {mode === "generate" ? "Create an email" : "Reply with confidence"}
              </Typography>
              <Typography className="page-description">
                {mode === "generate"
                  ? "Turn your thoughts into a clear, professional email in seconds."
                  : "Paste an email and create a thoughtful reply in your preferred tone."}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              className="new-button"
              onClick={startNew}
            >
              New email
            </Button>
          </Box>

          <Box className="workspace-grid">
            <Paper elevation={0} className="composer-card">
              <Box className="card-heading">
                <Box className="heading-icon">
                  {mode === "generate" ? (
                    <EmailRoundedIcon />
                  ) : (
                    <ReplyRoundedIcon />
                  )}
                </Box>
                <Box>
                  <Typography className="section-title">
                    {mode === "generate" ? "Email details" : "Original email"}
                  </Typography>
                  <Typography className="section-subtitle">
                    {mode === "generate"
                      ? "Tell us what you want to communicate"
                      : "Paste the message you received"}
                  </Typography>
                </Box>
              </Box>

              {mode === "generate" ? (
                <Box className="field-group">
                  <Typography className="field-label">
                    What is this email about?
                  </Typography>
                  <TextField
                    multiline
                    minRows={6}
                    fullWidth
                    placeholder="E.g. Write a job application email for a Java Spring Boot internship. Mention my Java, Spring Boot and SQL skills..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="custom-field"
                  />
                  <Typography className="helper-text">
                    Include the purpose, recipient, and key points.
                  </Typography>
                </Box>
              ) : (
                <Box className="field-group">
                  <Typography className="field-label">
                    Email content
                  </Typography>
                  <TextField
                    multiline
                    minRows={7}
                    fullWidth
                    placeholder="Paste the email you received here..."
                    value={originalEmail}
                    onChange={(e) => setOriginalEmail(e.target.value)}
                    className="custom-field"
                  />
                </Box>
              )}

              <Box className="field-group model-selector-group">
                <Typography className="field-label">AI model</Typography>

                <Box className="model-options">
                  <Paper
                    component="button"
                    type="button"
                    elevation={0}
                    className={`model-option ${
                      selectedModel === "gemini" ? "selected" : ""
                    }`}
                    onClick={() => setSelectedModel("gemini")}
                    aria-pressed={selectedModel === "gemini"}
                  >
                    <Box className="model-icon gemini-icon">
                      <SmartToyRoundedIcon />
                    </Box>
                    <Box className="model-info">
                      <Typography className="model-name">
                        Gemini 3.5 Flash Lite
                      </Typography>
                      <Typography className="model-description">
                        Google · Fast responses
                      </Typography>
                    </Box>
                    <Box className="model-radio">
                      {selectedModel === "gemini" && (
                        <CheckCircleRoundedIcon />
                      )}
                    </Box>
                  </Paper>

                  <Paper
                    component="button"
                    type="button"
                    elevation={0}
                    className={`model-option ${
                      selectedModel === "openrouter" ? "selected" : ""
                    }`}
                    onClick={() => setSelectedModel("openrouter")}
                    aria-pressed={selectedModel === "openrouter"}
                  >
                    <Box className="model-icon nvidia-icon">
                      <SmartToyRoundedIcon />
                    </Box>
                    <Box className="model-info">
                      <Typography className="model-name">
                        NVIDIA Nemotron 3.5 Lightning
                      </Typography>
                      <Typography className="model-description">
                        OpenRouter · Better Responses
                      </Typography>
                    </Box>
                    <Box className="model-radio">
                      {selectedModel === "openrouter" && (
                        <CheckCircleRoundedIcon />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Box>

              <Divider className="section-divider" />

              <Box className="settings-heading">
                <TuneRoundedIcon fontSize="small" />
                <Typography className="section-title">
                  Writing preferences
                </Typography>
              </Box>

              <Box className="settings-grid">
                <Box>
                  <Typography className="field-label">Tone</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="select-field"
                  >
                    <MenuItem value="Professional">Professional</MenuItem>
                    <MenuItem value="Friendly">Friendly</MenuItem>
                    <MenuItem value="Formal">Formal</MenuItem>
                    <MenuItem value="Casual">Casual</MenuItem>
                    <MenuItem value="Persuasive">Persuasive</MenuItem>
                  </Select>
                </Box>

                <Box>
                  <Typography className="field-label">Length</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="select-field"
                  >
                    <MenuItem value="Short">Short</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Detailed">Detailed</MenuItem>
                  </Select>
                </Box>

                <Box className="language-setting">
                  <Typography className="field-label">Language</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="select-field"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Hindi">Hindi</MenuItem>
                    <MenuItem value="Hinglish">Hinglish</MenuItem>
                  </Select>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                className="generate-button"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading
                  ? "Creating your email..."
                  : mode === "generate"
                    ? "Generate email"
                    : "Generate reply"}
              </Button>

              <Typography className="privacy-note">
                <CheckCircleRoundedIcon fontSize="small" />
                Review AI-generated content before sending.
              </Typography>
            </Paper>

            <Paper elevation={0} className="preview-card">
              <Box className="preview-heading">
                <Box>
                  <Typography className="section-title">
                    Email preview
                  </Typography>
                  <Typography className="section-subtitle">
                    Your email will appear here
                  </Typography>
                </Box>
                <Chip
                  label={generated ? "Draft ready" : "Waiting for input"}
                  className={generated ? "status-chip" : "waiting-chip"}
                  size="small"
                />
              </Box>

              {generated ? (
                <>
                  <Box className="email-meta">
                    <Typography className="meta-label">TO</Typography>
                    <Typography className="meta-value">
                      Recipient
                    </Typography>
                  </Box>
                  <Divider />
                  <Box className="email-meta subject-meta">
                    <Typography className="meta-label">SUBJECT</Typography>
                    <TextField
                      variant="standard"
                      fullWidth
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      InputProps={{ disableUnderline: true }}
                      className="subject-input"
                    />
                  </Box>
                  <Divider />

                  <TextField
                    multiline
                    fullWidth
                    minRows={14}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="email-body-input"
                  />

                  <Divider className="section-divider" />

                  <Box className="preview-actions">
                    <Button
                      variant="contained"
                      startIcon={
                        copied ? (
                          <CheckCircleRoundedIcon />
                        ) : (
                          <ContentCopyRoundedIcon />
                        )
                      }
                      className="copy-button"
                      onClick={handleCopy}
                    >
                      {copied ? "Copied" : "Copy email"}
                    </Button>
                    <Tooltip title="Generate another draft">
                      <IconButton
                        className="refresh-button"
                        onClick={handleGenerate}
                        disabled={loading}
                      >
                        <RefreshRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </>
              ) : (
                <Box className="empty-preview">
                  <Box className="empty-icon">
                    <AutoAwesomeRoundedIcon />
                  </Box>
                  <Typography className="empty-title">
                    Your next great email starts here
                  </Typography>
                  <Typography className="empty-description">
                    Add your details, choose a tone, and generate your email.
                    You can edit the result before copying it.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {notice && (
            <Paper elevation={0} className="notice">
              <Typography>{notice}</Typography>
            </Paper>
          )}

          <Box className="footer-note">
            <Typography>
              MailMuse · Write better emails, with less effort.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
