import { finalizeOnboarding, saveProgress, getProgress } from "./onboarding.service.js";

export async function finalizeOnboardingController(req, res) {
  try {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser) {
      return res.status(401).json({
        ok: false,
        message: "Usuário não autenticado",
      });
    }

    const {
      forcedBusinessId,
      entityName,
      email,
      whatsapp,
      subscription,
      businessType,
      ownerName,
    } = req.body;

    const result = await finalizeOnboarding({
      firebaseUser,
      forcedBusinessId,
      entityName,
      email,
      whatsapp,
      subscription,
      businessType,
      ownerName,
    });

    return res.status(200).json({
      ok: true,
      data: result,
      message: "Cadastro finalizado com sucesso.",
    });
  } catch (error) {
    console.error("[finalizeOnboardingController] Erro:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro interno ao finalizar cadastro.",
      error: error.message,
    });
  }
}

export async function saveProgressController(req, res) {
  try {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser) {
      return res.status(401).json({ ok: false, message: "Usuário não autenticado" });
    }

    const { step, data } = req.body;
    
    if (step == null) {
      return res.status(400).json({ ok: false, message: "O passo (step) é obrigatório." });
    }

    const result = await saveProgress({ firebaseUser, step, data });

    return res.status(200).json({
      ok: true,
      message: "Progresso salvo com sucesso.",
      data: result,
    });
  } catch (error) {
    console.error("[saveProgressController] Erro:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro interno ao salvar progresso.",
      error: error.message,
    });
  }
}

export async function getProgressController(req, res) {
  try {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser) {
      return res.status(401).json({ ok: false, message: "Usuário não autenticado" });
    }

    const result = await getProgress({ firebaseUser });

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("[getProgressController] Erro:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro interno ao recuperar progresso.",
      error: error.message,
    });
  }
}
