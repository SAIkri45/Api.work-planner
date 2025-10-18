export const DEF_SERVICE_RUNNING = "Service is up & running";
export const DEF_SUCCESS_RESP = "Success";
export const DEF_ERROR_RESP = "Internal server error";
export const DEF_422 = "Validation failed";
export const DEF_404 = "Data not found";
export const DEF_409 = "Data conflict encountered";
export const DEF_401 = "Unauthorized request";
export const DEF_403 = "Forbidden request";
export const DEF_400 = "Bad request";
export const NAME_422 = "Unprocessable entity";
export const NAME_404 = "Not found";
export const NAME_409 = "Conflict";
export const NAME_401 = "Unauthorized";
export const NAME_403 = "Forbidden";
export const NAME_400 = "Bad request";
export const SERVICES_FETCHED = "Services fetched successfully.";
export const ISSUES_FETCHED = "Issues fetched successfully.";
export const INVALID_INPUT = "Invalid input";
export const ISSUES_NOT_FOUND = "Issues not found";
export const LOGIN_VALIDATION_ERROR
    = "Login details provided do not meet the required validation criteria";
export const PASSWORD_INVALID = "Password is invalid";
export const PASSWORD_SHORT = "Password too short, min length is 6 characters";
export const PASSWORD_MISSING = "Password is missing";
export const TOKEN_INVALID = "Authorization token is invalid";
export const TOKEN_EXPIRED = "Authorization token expired";
export const TOKEN_SIG_MISMATCH = "Authorization token signature mismatched";
export const TOKEN_MISSING = "Authorization token required";
export const FORBIDDEN_ACCESS
    = "You are not authorized to access this resource";
export const USER_PAYLOAD_MISSING = "User Payload is missing";
export const LOGIN_EMAIL_NOT_FOUND
    = "Given email not found in the system. Please check with the manager";
export const LOGIN_PHONE_NOT_FOUND
    = "Given phone number not found in the system. Please check with the manager";
export const LOGIN_DONE = "Login successful";
export const ACCOUNT_INACTIVE = "Account inactive. Please contact manager";
export const RT_NOT_FOUND = "Refresh token not found";
export const TOKENS_GENERATED = "Tokens generated successfully";
export const USER_INACTIVE = "Your status is inactive. Please contact manager";
export const USER_NOT_FOUND = "User not found";
export const RESET_TOKEN_NOT_FOUND = "Reset token not found";
export const USER_TYPE_INVALID = "User type is invalid";
export const USER_STATUS = "User is inactive. Please contact admin";
export const NAME_INVALID = "Name is invalid";
export const NAME_MISSING = "Name is required";
export const USER_TYPE_REQUIRED = "User type is required";
export const NAME_TOO_SHORT
    = "Minimum length of the name is 3 characters";
export const DESIGNATION_TOO_SHORT = "Minimum length of the name is 3 characters";
export const DESIGNATION_INVALID = "Designation is invalid";
export const DESIGNATION_MISSING = "Designation is missing";
export const LAST_NAME_INVALID = "Last name is invalid";
export const EMAIL_INVALID = "Email is invalid";
export const EMAIL_MISSING = "Email is required";
export const PHONE_MISSING = "Phone number is required";
export const PHONE_REQUIRED = "Mobile number is required";
export const EMAIL_EXISTS = "Email already exists";

export const USER_VALIDATION_ERROR
    = "User details provided do not meet the required validation criteria";
export const USER_ADDED = "User added successfully";
export const USER_DELETED = "User deleted successfully";
export const DATE_INVALID = "Date is invalid";
export const PHONE_EXISTS = "Phone number already exists";
export const DATE_MISSING = "Date is required";
export const USER_CREATED = "User created successfully";
export const USER_FETCHED = "User details fetched successfully";
export const USER_UPDATED = "User updated successfully";
export const USER_ACTIVE_STATUS_REQUIRED = "Active status is required";
export const USER_ACTIVE_STATUS_UPDATED = "User status updated successfully";
export const USERS_FETCHED = "Users fetched successfully";
export const FAILED_TO_FETCH_USERS = "Failed to fetch users";
export const EMPLOYEES_FETCHED = " Employees fetched successfully";
export const USER_ALREADY_ASSIGNED = " Users were already assigned for this task";
export const USER_ALREADY_DELETE = "Assignee not found or already removed";
export const USER_NOT_ADDED = " User not assigned ";
export const TASKID_USERID_REQUIRED = " Task id and User id required ";
export const NO_NEW_ASSIGNEES = "No new assignees to add";
export const USER_ALREADY_EXISTS = "User with this email or phone number already exists";
export const DEVICE_TYPE_INVALID = "Device type is invalid";
export const DEVICE_TYPE_MISSING = "Device type is missing";
export const FAILED_TO_UPDATE_USER = "Failed to update user";

export const PROFILE_PIC_MISSING = "Profile pic is required";
export const PROFILE_PIC_TOO_SHORT
    = "Minimum length of the profile pic is 5 characters";
export const USER_PROFILE_PIC_UPDATED = "User profile pic updated successfully";
export const allowedGenderTypes = ["MALE", "FEMALE", "OTHER"];
export const GENDER_INVALID
    = "Gender must one of the following: MALE, FEMALE, OTHER";
export const GENDER_MISSING = "Gender is required";
export const ADDRESS_INVALID = "Address must be a string";
export const ADDRESS_TOO_SHORT
    = "Minimum length of the address is 10 characters";
export const DATE_OF_BIRTH_INVALID = "Date of birth is invalid";
export const DATE_OF_BIRTH_MISSING = "Date of birth is required";
export const LAST_NAME_MISSING = "Last name is required";
export const LAST_NAME_TOO_SHORT
    = "Minimum length of the last name is 1 characters";
export const PHONE_INVALID = "Enter a valid 10-digit mobile number";
export const PHONE_NUMBER_INVALID = "Phone number is invalid";
export const PHONE_NUMBER_MISSING = "Phone number is required";
 
export const  NOTIFICATIONS_FETCHED = "Notifications fetched successfully";
export const NOTIFICATION_ID_REQUIRED = "Notification id is required";
export const NOTIFICATION_READ = "Notification marked as read";
export const NOTIFICATION_NOT_FOUND = "Notification not found";
export const NOTIFICATIONS_READ = "All notifications marked as read";
export const NOTIFICATIONS_NOT_FOUND = "No notifications to read";
export const UNREAD_NOTIFICATIONS_COUNT_FETCHED = "Unread notifications count fetched successfully";


export const USER_DETAILS_FETCHED = "User details fetched successfully";
export const OTP_DOES_NOT_MATCH = "Invalid OTP";
export const OTP_EXPIRED = "OTP expired, please try again";
export const USER_COUNT_FETCHED = "User count fetched successfully";
export const USER_ID_MISSING = "User is missing";
export const USER_ID_INVALID = "User id must be a number";
export const OTP_SENT = "OTP sent successfully";
export const INVALID_STATUS = "Status must be a string";
export const REFRESH_TOKEN_NOT_FOUND = "Refresh token is not available";
export const ADDRESS_MISSING = "Address is missing";
export const PROFILE_PIC_INVALID = "Profile picture is invalid";
export const INVALID_CONTACT_ID = "Contact id is invalid";
export const CONTACT_FETCHED = "Contact fetched successfully";
export const INVALID_FILE = "File is invalid";
export const FILE_NOT_FOUND = "File not found";
export const CONTACTS_IMPORT_SUCCESS = "Contacts imported successfully";
export const CONTACTS_IMPORT_FAILED = "Contacts import failed";
export const CONTACTS_IMPORT_VALIDATION_FAILED = "Contacts import validation failed";
export const RECORDS_NOT_FOUND = "NO records found tO import";


export const PHONE_NUMBER_EXISTS = "Phone number already exists.";

// allowed users
export const allowedUserTypes = [
  "SUPER_ADMIN",
  "EMPLOYEE",
  "MANAGER",
  "ADMIN",
  "TEAM_LEAD",
] as const;

export const allowedUserStatuses = [
  "ACTIVE",
  "INACTIVE",
] as const;

export const allowedProjectStatus = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEW",
  "OVERDUE",
  "DONE",
] as const;

export const allowedTaskStatus = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEW",
  "OVERDUE",
  "DONE",
] as const;
// Type exports for use elsewhere if needed
export type UserType = typeof allowedUserTypes[number];
export type UserStatus = typeof allowedUserStatuses[number];
export type ProjectStatus = typeof allowedProjectStatus[number];
export type TaskStatus = typeof allowedTaskStatus[number];




export const TITLE_MISSING = "Title is required";
export const TITLE_TOO_SHORT = "Minimum length of the title is 3 characters";
export const DATE_IS_MISSING = "Date is required";
export const DATE_IS_INVALID = "Date is invalid";
export const DATE_REQUIRED = "Start Date is required";
export const DUE_DATE_REQUIRED = "Due Date is required";



// slackOAauth
export const MISSING_CODE = "Code is required";
export const USER_ACCESS_TOKEN_MISSING = "User access token is required";
export const USER_ACCESS_TOKEN_INVALID = "User access token is invalid";
export const USER_ACCESS_TOKEN_EXPIRED = "User access token is expired";
export const ACCESS_TOKEN_NOT_FOUND = "User ID not found in token response";
export const USER_INFO_NOT_FOUND = "User info not found in token response";
export const USER_PROFILE_INFO_NOT_FOUND = "User profile info not found in token response";
export const TOKEN_RESPONSE_NOT_FOUND = "Token response not found in token response";

export const SLACK_ID_INVALID = "slack_id is invalid";
export const SLACK_ID_MISSING = "slack_id is required";

export const USER_STATUS_INVALID = "User status is invalid";
export const USER_IDS_REQUIRED = "User IDs are required";
export const USER_STATUS_REQUIRED = "User status is required";

// projects

export const PROJECT_TITLE_REQUIRED = "Project title is required";
export const PROJECT_TITLE_MIN_LENGTH = "Project title should be atleast 3 letters";
export const VALID_TITLE = "Project title should contain letters only";

export const PROJECT_DESCRIPTION_REQUIRED = "Project description is required";
export const PROJECT_DESCRIPTION_MIN_LENGTH = "Project description should be atleast  8 characters";
export const VALID_DESCRIPTION = "Title should contain letters only";
export const PROJECT_LINKS_REQUIRED = "Project links are required";

// export const PROJECT_DESCRIPTION_TOO_SHORT = "Minimum  10 characters";
export const PROJECT_LINKS_TOO_SHORT = "Project links should be atleast 8 letters";

export const PROJECT_ALREADY_EXISTS = "Project title already exists";
export const PROJECT_LOGO_URL_INVALID = "Project logo URL is invalid";
export const PROJECT_LOGO_URL_MISSING = "Project logo URL is missing";

export const PROJECT_LINKS_MISSING = "Project links are missing";

export const PROJECT_CREATED = "Project created successfully";
export const PROJECT_UPDATED = "Project updated successfully";
export const PROJECT_DELETED = "Project deleted successfully";
export const PROJECT_NOT_FOUND = "Project not found";
export const AVILABLE_USERS_FETCHED = "Users fetched successfully";
export const PROJECT_TASKS_FETCHED = "Project tasks fetched successfully";
export const TASKS_STATUS_FETCHED = "Tasks status fetched successfully";
export const PROJECTS_FETCHED = "Projects fetched successfully";
export const PROJECTS_FETCHED_SUCCESS = "Projects fetched successfully";
export const PROJECTS_USERS_FETCHED_SUCCESS = "Project users fetched successfully";
export const PROJECT_STATUS_UPDATED = "Project status updated successfully";
export const PROJECT_NOT_FOUND_ID = "Project not found with id";
export const PROJECT_STATUS = "Project cannot delete status not completed";
export const PROJECT_TASKS_IN_COMPLETED = "Project cannot delete tasks not completed";
export const PROJECT_VALIDATION_ERROR = "Project details provided do not meet the required validation criteria";
export const PROJECT_USERS_VALIDATION_ERROR = "Details provided do not meet the required validation criteria";
export const PROJECT_STATUS_REQUIRED = "Project status is required";
export const PROJECT_STATUS_MISSING = "Project status is missing";
export const PROJECT_CREATED_BY_MISSING = "Project created by is required";
export const PROJECT_CREATED_BY_INVALID = "Project created by is invalid";
export const PROJECT_TITLE_INVALID = "Project title is invalid";
export const PROJECT_TITLE_MISSING = "Project title is required";
export const PROJECT_TITLE_TOO_SHORT = "Minimum length of the project title is 3 characters";
export const PROJECT_DESCRIPTION_INVALID = "Project description is invalid";
export const PROJECT_ID_REQUIRED = " Project id is required";
export const PROJECT_FETCHED = "project data fetched successfully";
// Tasks
export const TASK_TITLE_INVALID = "Task title is invalid";
export const TASK_TITLE_MISSING = "Task title is required";
export const TASK_TITLE_TOO_SHORT = "Task title should be atleast 3 characters";
export const TASK_DESCRIPTION_INVALID = "Task description is required";
export const TASK_TITLE_MIN_LENGTH = "Task description should be atleast 3 characters";
export const TASK_PROJECT_ID_INVALID = "Task project ID is invalid";
export const TASK_PROJECT_ID_MISSING = "Task project ID is required";
export const TASK_STATUS_INVALID = "Task status is invalid";
export const TASK_STATUS_MISSING = "Task status is required";
export const TASK_STATUS_REQUIRED = "Task status is required";
export const TASK_CREATED_BY_MISSING = "Task created by is required";
export const TASK_CREATED_BY_INVALID = "Task created by is invalid";
export const TASKS_FETCHED = "Tasks fetched successfully";
export const TASK_CREATED = "Task created successfully";
export const TASK_NOT_FOUND = "Task not found";
export const TASK_VALIDATION_ERROR = "Task details provided do not meet the required validation criteria";
export const TASK_ALREADY_EXISTS = "Task  title already exists";
export const TASK_DELETED = "Task deleted successfully";
export const TASK_USERS_DELETED = "Task assigned users deleted successfully";
export const TASK_UPDATED = "Task updated successfully";
export const TASK_ID_REQUIRED = "Task ID is required";
export const TASK_ID_INVALID = "Task ID is invalid";
export const TASK_CANNOT_DELETED = "Task cannot be deleted because it still has active assignees";
export const TASK_STATUS_NOT_COMPLETED = "Task status is not completed";
export const TRANSACTION_ROLLBACK = "Task Title is required";
export const TASK_ASSIGNEES_DELETED = "Task assignees deleted successfully";
export const TASK_ASSIGNEES_FETCHED = "Task assignees fetched successfully";
export const TASK_FAILED_TO_FETCH = " Tasks failed to fetch ";
export const TASK_STATUS_FETCHED = " Task status fetched successfully ";
export const DASHBOARD_FETCHED = "Dashboard stats fetched successfully";
export const TASKS_COUNT_FETCHED = "Tasks count fetched successfully";
export const TODAY_TASKS_FETCHED = "Today's tasks fetched successfully";
export const OVERDUE_TASKS_FETCHED = "Overdue tasks fetched successfully";
export const USER_TASKS_FETCHED = "User tasks fetched successfully";
export const TODAY_TASKS_STATUS_COUNT_FETCHED = "Today's tasks status count fetched successfully";
export const USER_TASKS_STATUS_COUNT_FETCHED = "User tasks status count fetched successfully";
export const TASK_ASSIGNEE_ADDED = "Task assignee added successfully";
export const TASK_ASSIGNEE_EXISTS = "Task assignee already exists";
export const PROJECT_USERS_ASSIGNED = "Users assigned successfully";
export const USERS_ASSIGNED = "Users assigned successfully";
export const TASK_ASSIGNEE_NOT_FOUND = "Task assignee not found";
export const TASK_ASSIGNEE_VALIDATION_ERROR = "Task assignee details provided do not meet the required validation criteria";
export const TASK_ASSIGNEE_USER_ID_INVALID = "Task assignee user ID is invalid";
export const TASK_ASSIGNEE_USER_ID_MISSING = "Task assignee user ID is required";
export const TASK_ASSIGNEE_TASK_ID_INVALID = "Task assignee task ID is invalid";
export const TASK_ASSIGNEE_TASK_ID_MISSING = "Task assignee task ID is required";
export const TASK_ASSIGNEE_CREATED_BY_INVALID = "Task assignee created by is invalid";
export const TASK_ASSIGNEE_CREATED_BY_MISSING = "Task assignee created by is required";
export const TASK_ASSIGNEE_ALREADY_EXISTS = "Task assignee already exists";
export const FILE_UPLOAD_LIMIT = "File size must be less than 5 MB";
export const FILE_UPLOAD_SUCCESS = "File uploaded successfully";
export const PROJECT_USERS_REMOVED = "Users removed successfully";
export const TASK_STATUS_UPDATED = "Task status updated successfully";

// add user defined messages here
export const EMAIL_REQUIRED = "Email is required";
export const EMAIL_MIN_LENGTH = "Email must be at least 8 characters";
export const PASSWORD_REQUIRED = "Password is required";
export const PASSWORD_MIN_LENGTH = "Password must be at least 8 characters";
export const USER_EXIST_WITH_EMAIL = "User already exists with this email";
export const USER_CREATED_SUCCESSFULLY = "User created successfully";
export const INVALID_CREDENTIALS = "Invalid credentials";
export const USER_LOGIN = "Login successfully";
export const USER_PHONE_REQUIRED = "Phone number is required";
export const INVALID_PHONE_NUMBER = "Invalid phone number";
export const DESIGNATION_REQUIRED = "Designation is required";
export const DESIGNATION_MIN_LENGTH = "Designation must be at least 8 characters";
export const USER_NAME_REQUIRED = "Name is required";
export const USER_NAME_MIN_LENGTH = "User name must be at least 3 characters";
export const USER_ID_REQUIRED = "User id is required";
export const USER_PASSWORD_CHANGED = "Password updated successfully";
export const INVALID_EMAIL = "Invalid email address";
export const ROLE_REQUIRED = "Role is required";
export const USER_UNAUTHORIZED = "Unauthorized access";
