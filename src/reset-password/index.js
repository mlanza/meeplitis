import supabase from "/lib/supabase.js";

async function resetPassword(e){
  e.preventDefault();
  const email = this[0].value;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://meeplitis.com/update-password',
  });
  if (error) {
    throw error;
  }
  console.log(data);
  alert("If your email address was registered, you will receive an email with a link to reset your password shortly.");
}

const signInForm = document.querySelector('#signin');
document.querySelector('#signin').onsubmit = resetPassword.bind(signInForm);

