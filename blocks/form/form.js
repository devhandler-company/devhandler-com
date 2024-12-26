import createField from "./form-fields.js";
import { adjustFormToMultistep } from "./multistep.js";

async function createForm(formHref, submitHref, block) {
    const { pathname } = new URL(formHref);
    const resp = await fetch(pathname);
    const json = await resp.json();
    const isMultiStepForm = block.classList.contains("multistep");

    const form = document.createElement("form");
    form.dataset.action = submitHref;

    const fields = await Promise.all(json.data.map((fd) => createField(fd, form)));
    fields.forEach((field) => {
        if (field.classList.contains("heading-wrapper") && field && isMultiStepForm) {
            field.classList.add("multistep-heading");
            block.parentElement.prepend(field);
        } else if (field) {
            form.append(field);
        }
    });

    // group fields into fieldsets
    const fieldsets = form.querySelectorAll("fieldset");
    fieldsets.forEach((fieldset) => {
        form.querySelectorAll(`[data-fieldset="${fieldset.name}"`).forEach((field) => {
            fieldset.append(field);
        });
    });

    if (isMultiStepForm) {
        adjustFormToMultistep(form);
    }

    return form;
}
function generatePayload(form) {
    const payload = {};

    [...form.elements].forEach((field) => {
        if (field.name && field.type !== "submit" && !field.disabled) {
            if (field.type === "radio") {
                if (field.checked) payload[field.name] = field.value;
            } else if (field.type === "checkbox") {
                if (field.checked)
                    payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
            } else {
                payload[field.name] = field.value;
            }
        }
    });
    return payload;
}

async function handleSubmit(form) {
    if (form.getAttribute("data-submitting") === "true") return;

    const submit = form.querySelector('button[type="submit"]');
    submit.classList.add("color-gray");
    try {
        form.setAttribute("data-submitting", "true");
        submit.disabled = true;

        // create payload
        const payload = generatePayload(form);
        const response = await fetch(form.dataset.action, {
            method: "POST",
            body: JSON.stringify({ data: payload }),
            // headers: {
            //     contentType: "application/json",
            // },
            mode: "cors",
            redirect: "follow",
        });
        if (response.ok) {
            const formContainer = form.parentElement.parentElement;
            const thankYouMessageContainer = document.createElement("div");
            thankYouMessageContainer.classList.add("thankyou-message-container");

            const thankyouImage = document.createElement("img");
            thankyouImage.src = "/icons/header-logo.svg";
            thankyouImage.classList.add("thankyou-image");
            thankyouImage.alt = "Devhandler logo";
            thankYouMessageContainer.append(thankyouImage);

            const thankYouMessage = document.createElement("span");
            thankYouMessage.classList.add("thankyou-message");
            thankYouMessage.classList.add("h2");
            thankYouMessage.textContent =
                "Thank you for filling out the form! Our team is processing your request and will get in touch with you shortly";
            thankYouMessageContainer.append(thankYouMessage);

            formContainer.replaceChildren(thankYouMessageContainer);
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
    } finally {
        form.setAttribute("data-submitting", "false");
        submit.disabled = false;
    }
}

export default async function decorate(block) {
    const links = [...block.querySelectorAll("a")].map((a) => a.href);
    const formLink = links.find((link) => link.startsWith(window.location.origin) && link.endsWith(".json"));
    const submitLink = links.find((link) => link !== formLink);
    if (!formLink || !submitLink) return;

    const form = await createForm(formLink, submitLink, block);

    block.replaceChildren(form);
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const valid = form.checkValidity();
        if (valid) {
            handleSubmit(form);
        } else {
            const firstInvalidEl = form.querySelector(":invalid:not(fieldset)");
            if (firstInvalidEl) {
                firstInvalidEl.focus();
                firstInvalidEl.scrollIntoView({ behavior: "smooth" });
            }
        }
    });
}
