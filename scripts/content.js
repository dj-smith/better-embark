// Utilities to scrape gene information out of an Embark page and add messages explaining the resuts.

let profileType = "STANDARD"; // regular Embark by default.
const BREEDER_TRAIT_REGEX = /\([A-z|\s]+\)\n/g;

// Standard profiles have 6 trait sections, Embark for Breeders profiles have 5.
const traitsDivs = document.querySelectorAll('.traits-section');
let traitsDivIndexOffset = 0
if (traitsDivs.length === 5) {
    profileType = "BREEDERS";
    // The Coat Color Mods section is lumped in with base color for Breeders profiles,
    // so we'll need to adjust the rest of the divs down one in the list as well.
    traitsDivIndexOffset = -1;
}
const baseColorDiv = traitsDivs[0].querySelector(".traits-module-item");; // Same for all profile types
const coatColorModsDiv = traitsDivs[1 + traitsDivIndexOffset].querySelector(".traits-module-item");;
const otherCoatTraitsDiv = traitsDivs[2 + traitsDivIndexOffset].querySelector(".traits-module-item");;
const bodyFeaturesDiv = traitsDivs[3 + traitsDivIndexOffset].querySelector(".traits-module-item");;
const bodySizeDiv = traitsDivs[4 + traitsDivIndexOffset].querySelector(".traits-module-item");;
const performanceDiv = traitsDivs[5 + traitsDivIndexOffset].querySelector(".traits-module-item");;

function extractResult(geneName) {
    let selector = "trait-description-" + geneName;
    let traitDiv = document.querySelector(`[id^="trait-description-${geneName}"]`);
    if (traitDiv !== null) {
        switch (profileType) {
            case "STANDARD":
                return traitDiv.querySelector(".space-below").querySelectorAll('strong')[1].textContent.trim();
            case "BREEDERS":
                let result = traitDiv.parentElement.querySelector('.trait-result').textContent.match(BREEDER_TRAIT_REGEX)[0];
                return result.substring(1, result.length - 2);
            case "SELF":
                break;
            default: break;
        }
    }
    return `NoCall(${geneName})`;
}

function isRecessiveRed(eLocus) {
    return eLocus === "ee";
}

function eumelaninColor(bLocus, dLocus) {
    if (bLocus === "bb") {
        return dLocus === "dd" ? "LILAC" : "BROWN";
    }
    return dLocus === "dd" ? "BLUE" : "BLACK";
}

function processALocus(aLocus, maybeBrindle) {
    if (aLocus.length === 2) {
        return "Recessive solid, without any phaeomelanin (yellow/tan) areas.";
    } else {
        const alleleA = aLocus.substring(0, 2);
        switch (alleleA) {
            case "ay":
                return "Sable: base color will be sandy, tan, fawn, or red, with or without shading or tipping.";
            case "aw":
                return "Agouti (wild type). Dog will have a blend of eumelanin and phaeomelanin hairs across their body.";
            case "at":
                return "Tan points" + (maybeBrindle ? "(or brindle points)." : ".");
            default: break;
        }
    }
    return "[ERROR] processing A Locus failed";
}

function processSLocus(sLocus) {
    let sLocusText;
    switch (sLocus.length) {
        case 2:
            sLocusText = "No piebald detected.";
            break;
        case 3:
            sLocusText = "Piebald carrier. Dog may have small amounts of white.";
            break;
        case 4:
            sLocusText = "Piebald. Dog should have large areas of white coat.";
            break;
        default: break;
    }
    return sLocusText + " Regardless of this piebald result, a dog may have white from other factors, such as residual white, untestable white spotting, merle, very pale pigmentation, or whitehead.";
}

let infoDiv, ul, item;

function summarizeBaseColor(baseColor) {
    // Traits in the base color section.
    const eLocus = baseColor['eLocus'];
    const cocoa = baseColor['cocoa'];
    const intensity = baseColor['intensity'];
    const bLocus = baseColor['bLocus'];
    const dLocus = baseColor['dLocus'];

    infoDiv = document.createElement("div");
    infoDiv.textContent = `[Quick Genotype: ${eLocus} ${bLocus} ${dLocus} ${cocoa} with ${intensity}]`;
    baseColorDiv.insertAdjacentElement("afterbegin", infoDiv);
    ul = infoDiv.appendChild(document.createElement("ul"));
    infoDiv.insertAdjacentElement("beforeend", ul);
    item = ul.appendChild(document.createElement("li"));
    if (isRecessiveRed(eLocus)) {
        item.textContent = `Recessive red and can't produce eumelanin in hairs, including eyelashes and whiskers. `;
    } else {
        item.textContent = `Physically able to produce eumelanin (black, blue, brown, or lilac) pigment in hair. `;
    }
    let eu = eumelaninColor(bLocus, dLocus);
    ul.appendChild(document.createElement("li")).textContent = `Eumelanin color is ${eu}. Any eumelanin (including eye rims, nose, and lips) will be ${eu}`;
    ul.appendChild(document.createElement("li")).textContent = `Cocoa is only relevant to French Bulldogs and their mixes.`;
}

function summarizeCoatColorMods(coatColorMods) {
    // Coat color modifiers. Skipping masking because we don't need it.
    const kLocus = coatColorMods['kLocus'];
    const aLocus = coatColorMods['aLocus'];
    const raly = coatColorMods['raly'];
    const sLocus = coatColorMods['sLocus'];
    const rLocus = coatColorMods['rLocus'];
    const merle = coatColorMods['merle'];
    const harlequin = coatColorMods['harlequin'];

    infoDiv = document.createElement("div");
    infoDiv.textContent = `[Quick Genotype: ${kLocus} ${aLocus} ${raly} ${sLocus} ${rLocus} ${merle} ${harlequin}]`;
    ul = infoDiv.appendChild(document.createElement("ul"));
    infoDiv.insertAdjacentElement("beforeend", ul);
    coatColorModsDiv.insertAdjacentElement("afterbegin", infoDiv);
    switch (kLocus) {
        case "KBKB":
            item = "Dominant solid. Full eumelanin coat. Other genes (such as merle, piebald, seal, or domino) may affect whether the appearance is actually solid or not.";
            break;
        case "KBky":
            item = "KB/ky: may be dominant solid or may be brindle. Brindle is untestable and 4 genotypes (KB/ky, KB/Kbr, Kbr/Kbr, and Kbr/ky) all test as KB/ky.";
            break;
        case "kyky":
            item = "Able to have both eumelanin and phaeomelanin in coat. Pattern will be determined by the A-Locus.";
            break;
        default:
            break;
    }

    ul.appendChild(document.createElement("li")).textContent = item;
    if (kLocus !== "KBKB") {
        item = "A-Locus: " + processALocus(aLocus, kLocus === "KBky");
    } else {
        item = "A-Locus pattern will have no effect; dog is dominant solid.";
    }
    ul.appendChild(document.createElement("li")).textContent = item;


    item = "RALY (saddle tan) test is outdated/unreliable and should usually be ignored.";
    ul.appendChild(document.createElement("li")).textContent = item;

    item = processSLocus(sLocus);
    ul.appendChild(document.createElement("li")).textContent = item;

    if (rLocus !== "rr") {
        item = "Roan detected. If there are large white areas in the coat, they should have ticking, roaning, or Dalmatian spots.";
        ul.appendChild(document.createElement("li")).textContent = item;
    }

    let isMerle = false;
    switch (merle) {
        case "M*M*":
            item = "[ATTENTION] Dog tests as double merle and may have impaired vision or hearing.";
            isMerle = true;
            break;
        case "M*m":
            item = "Dog tests as single merle.";
            isMerle = true;
            break;
        case "mm":
            item = "No merle detected.";
            break;
        default:
            break;
    }
    if (isMerle) {
        item += " [ATTENTION] If you plan to breed this dog or any of its offspring, you should test the merle length," +
            " and all potential breeding partners should be tested for merle even if they look non-merle.";
    }
    ul.appendChild(document.createElement("li")).textContent = item;

    if (harlequin !== "hh") {
        item = "Harlequin detected. This gene only exists in Great Danes and their mixes, regardless of whether Dane was detected by Embark. It can only express in merle dogs.";
        if (isMerle) {
            let harlequinBase = "mantle";
            if (kLocus === "KBky") {
                harlequinBase += "- or brindle";
            } else if (kLocus === "kyky") {
                harlequinBase = "fawn";
            }
            item += ` This dog is merle and harlequin (${harlequinBase}-based).`;
        } else {
            item += " This dog is non-merle, but it can produce harlequin offspring if paired with a merle dog.";
        }
        ul.appendChild(document.createElement("li")).textContent = item;
    }
}

function summarizeOtherCoatTraits(otherCoatTraits) {
    const furnishings = otherCoatTraits['furnishings'];
    const longhair = otherCoatTraits['longhair'];
    const shedding = otherCoatTraits['shedding'];
    const curl = otherCoatTraits['curl'];
    const foxi3 = otherCoatTraits['xolo'];
    const sgk3 = otherCoatTraits['aht'];
    const albino = otherCoatTraits['albino'];

    infoDiv = document.createElement("div");
    infoDiv.textContent = `[Quick Genotype: ${furnishings} ${longhair} ${shedding} ${curl} ${foxi3} ${sgk3} ${albino}]`;
    ul = infoDiv.appendChild(document.createElement("ul"));
    infoDiv.insertAdjacentElement("beforeend", ul);
    otherCoatTraitsDiv.insertAdjacentElement("afterbegin", infoDiv);

    let coatCurl;
    switch (curl) {
        case "CC":
            coatCurl = "straight";
            break;
        case "CT":
            coatCurl = "wavy";
            break;
        case "TT":
            coatCurl = "curly";
            break;
        default: break;
    }

    let furnished = furnishings !== "II";
    let coatLength = longhair === "TT" ? "long" : "short";
    let coatTexture = coatLength === "short" && furnished ? "wiry" : "smooth";

    item = `Coat should be ${coatLength}, ${coatTexture}, and relatively ${coatCurl}.`;
    ul.appendChild(document.createElement("li")).textContent = item;

    if (furnished) {
        item = "Dog has furnishings (facial hair) which may affect the coat length, texture, and shedding pattern.";
        ul.appendChild(document.createElement("li")).textContent = item;
    }

    if (shedding == "TT") {
        item = "Normal-to-low shedding that is not seasonal.";
    } else {
        item = "High seasonal shedding. Dog may \"blow coat\" seasonally.";
    }
    ul.appendChild(document.createElement("li")).textContent = item;

    if (foxi3 === "NDup") {
        item = "Dog is hairless (type: Xoloitzcuintli, Chineses Crested, or Peruvian Hairless Dog)";
        ul.appendChild(document.createElement("li")).textContent = item;
    }
    if (sgk3 === "ND") {
        item = "Dog carries a hairlessness gene (type: American Hairless Terrier).";
        ul.appendChild(document.createElement("li")).textContent = item;
    } else if (sgk3 === "DD") {
        item = "Dog is hairless (type: American Hairless Terrier)";
        ul.appendChild(document.createElement("li")).textContent = item;
    }

    if (albino !== "NN") {
        item = `[ATTENTION] Dog ${albino === "DD" ? "has" : "carries"} Doberman (Z-factor) albinism.`;
        ul.appendChild(document.createElement("li")).textContent = item;
    }
}

function summarizeBodyFeatures(bodyFeatures) {
    const shortMuzzle = bodyFeatures['shortMuzzle'];
    const bobtail = bodyFeatures['bobtail'];
    const hindDewclaws = bodyFeatures['hindDewclaws'];
    const muscling = bodyFeatures['muscling'];
    const blueEyes = bodyFeatures['blueEyes'];

    infoDiv = document.createElement("div");
    infoDiv.textContent = `[Quick Genotype: ${shortMuzzle} ${bobtail} ${hindDewclaws} ${muscling} ${blueEyes}]`;
    ul = infoDiv.appendChild(document.createElement("ul"));
    infoDiv.insertAdjacentElement("beforeend", ul);
    bodyFeaturesDiv.insertAdjacentElement("afterbegin", infoDiv);

    if (shortMuzzle === "AA") {
        item = "Short snout detected. Dog should have a shorter nose and flatter face than normal.";
    } else {
        item = "Short snout not detected. Dog most likely will have a normal/medium snout, but may have a long one. " +
            "Not all forms of short snout are testable.";
    }
    ul.appendChild(document.createElement("li")).textContent = item;

    if (bobtail === "CG") {
        item = "Natural bobtail gene present. If dog has a short tail, it may have been born that way.";
    } else {
        item = "No natural bobtail detected. Not all forms of natural bobtail are testable.";
    }
    ul.appendChild(document.createElement("li")).textContent = item;

    if (muscling === "CC") {
        item = "No special bulk gene detected. This dog might still be muscular, but it's not as a result of this particular gene.";
        ul.appendChild(document.createElement("li")).textContent = item;
    }

    if (blueEyes !== "NN") {
        item = "One or both eyes may be true blue, independent of coat color.";
    } else {
        item = "Dog doesn't have the blue eye gene, but might have blue eyes due to other factors.";
    }
    item += " Blue eyes can also be caused by coat color traits that remove pigment, such as merle, whitehead, and piebald." +
        " In addition, lightened eyes from a dilute coat may appear blue but are not.";

    ul.appendChild(document.createElement("li")).textContent = item;
}

function summarizeSize() {
    infoDiv = document.createElement("div");
    infoDiv.textContent = "These genes are responsible for about 80% of size variation in dogs, but aren't completely predictive. Take them with a grain of salt.";
    infoDiv.style.paddingBottom = "10px";
    bodySize.insertAdjacentElement("afterbegin", infoDiv);
}

function summarizePerformance(altitude, appetite) {
    infoDiv = document.createElement("div");
    infoDiv.textContent = "This section isn't relevant to most dogs. Altitude Adaptation is only found in a handful of rare breeds. POMC is mainly found in Labradors and their mixes.";
    ul = infoDiv.appendChild(document.createElement("ul"));
    infoDiv.insertAdjacentElement("beforeend", ul);
    performanceDiv.insertAdjacentElement("afterbegin", infoDiv);

    if (altitude !== "GG") {
        ul.appendChild(document.createElement("li")).textContent = "Dog has the gene to be adapted to low oxygen environments.";
    }

    if (appetite !== "NN") {
        item = "[ATTENTION] Dog has POMC. This is listed as a trait, but is pretty much a genetic disease that causes abnormally high appetite.";
    } else {
        item = "Dog does not have POMC, a genetic disease that affects appetite. Dog may still have high food motivation, but it's a behavioral trait rather than a lack of healthy hunger signalling.";
    }
    ul.appendChild(document.createElement("li")).textContent = item;
}

const baseColor = {
    'eLocus': extractResult("MC1R"),
    'cocoa': extractResult("HPS3_Cocoa"),
    'intensity': extractResult("Intensity_red_pigment"),
    'bLocus': extractResult("TYRP1"),
    'dLocus': extractResult("MLPH_D"),
}
summarizeBaseColor(baseColor);

const coatColorMods = {
    'kLocus': extractResult("CBD103_K"),
    'aLocus': extractResult("ASIP"),
    'raly': extractResult("RALY_Saddle_trait_gene"),
    'sLocus': extractResult("MITF"),
    'rLocus': extractResult("USH2A_Roan"),
    'merle': extractResult("PMEL_Merle"),
    'harlequin': extractResult("PSMB7_H"),
}
summarizeCoatColorMods(coatColorMods);

const otherCoatTraits = {
    'furnishings': extractResult("RSPO2_moustache"),
    'longhair': extractResult("FGF5"),
    'shedding': extractResult("MC5R_shedding"),
    'curl': extractResult("KRT71_CurlyCoat"),
    'xolo': extractResult("FOXI3_Hairless_Linkage"),
    'aht': extractResult("SGK3_Hairless"),
    'albino': extractResult("SLC45A2_oculocutaneous_albinism_type_2_doberman_Z_factor")
};
summarizeOtherCoatTraits(otherCoatTraits);

const bodyFeatures = {
    'shortMuzzle': extractResult("BMP3_Muzzle"),
    'bobtail': extractResult("T_C189G_Bobtail"),
    'hindDewclaws': extractResult("LMBR1_Claw"),
    'muscling': extractResult("ACSL4_Bulky_trait_gene"),
    'blueEyes': extractResult("ALX4_Blue_Eyes_Linkage")
}
summarizeBodyFeatures(bodyFeatures);

// Not bothering to dig into the individual size traits for now, but adding an explanation of the section.
summarizeSize();

const altitude = extractResult("EPAS1_altitude");
const appetite = extractResult("POMC_appetite_linkage");
summarizePerformance(altitude, appetite);