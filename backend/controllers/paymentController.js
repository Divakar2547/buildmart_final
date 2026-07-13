// Razorpay payment controller
// To be implemented later

exports.createQrCode = async (req, res) => {
  try {
    const amount = Number(req.body?.amount ?? req.query?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required' });
    }

    // Generate UPI QR code
    const upiData = encodeURIComponent(`upi://pay?pa=buildmart@upi&pn=BuildMart&am=${amount}&cu=INR`);
    return res.json({
      success: true,
      qr: {
        id: 'qr_' + Date.now(),
        image_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${upiData}`,
      }
    });
  } catch (error) {
    console.error('QR generation failed:', error.message);
    const amount = Number(req.body?.amount ?? req.query?.amount ?? 0);
    const upiData = encodeURIComponent(`upi://pay?pa=buildmart@upi&pn=BuildMart&am=${amount || 0}&cu=INR`);
    return res.json({
      success: true,
      qr: {
        id: 'qr_' + Date.now(),
        image_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${upiData}`,
      }
    });
  }
};
